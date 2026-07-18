import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, OrderHistoryAction, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { AssignCommercialDto } from './dto/assign-commercial.dto';
import { SearchOrderDto } from './dto/search-order.dto';
import { TrackOrderDto } from './dto/track-order.dto';

/**
 * Ordre "logique" des statuts, utilisé uniquement pour interdire un retour
 * en arrière accidentel (ex: repasser une commande PREPARING à CREATED).
 * CANCELLED est un état terminal atteignable depuis n'importe quel statut
 * non terminal — il n'a donc pas d'index dans cette séquence.
 */
const STATUS_SEQUENCE: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.AWAITING_CALL,
  OrderStatus.CALLING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
  OrderStatus.DELIVERED,
];

const TERMINAL_STATUSES: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  school: true,
  grade: true,
  commercial: { select: { id: true, fullName: true, email: true } },
  history: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Création publique, sans compte. Pour chaque article :
   * - avec productId -> le prix et le libellé viennent du catalogue (le
   *   client ne peut pas falsifier le prix envoyé depuis le front) ;
   * - sans productId -> article libre (ex: issu d'une liste scolaire
   *   personnalisée non cataloguée), le prix vient du client et sera
   *   ajusté si besoin par le commercial lors de l'appel.
   * Pas d'entrée OrderHistory ici : l'historique ne trace que les
   * changements après création, pas la création elle-même.
   */
  async create(dto: CreateOrderDto) {
    const resolvedItems = await this.resolveItems(dto.items);
    const totalAmount = this.computeTotal(resolvedItems);

    for (let attempt = 0; attempt < 5; attempt++) {
      const orderNumber = await this.generateOrderNumber();
      try {
        return await this.prisma.order.create({
          data: {
            orderNumber,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            customerEmail: dto.customerEmail,
            customerGender: dto.customerGender,
            customerRole: dto.customerRole,
            deliveryAddress: dto.deliveryAddress,
            schoolId: dto.schoolId,
            gradeId: dto.gradeId,
            note: dto.note,
            totalAmount,
            items: { create: resolvedItems },
          },
          include: ORDER_INCLUDE,
        });
      } catch (error) {
        // Collision sur orderNumber (unique) : deux créations concurrentes
        // dans la même seconde -> on régénère et on retente.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new BadRequestException("Impossible de générer un numéro de commande, réessayez.");
  }

  /** Suivi public : nécessite le numéro de commande ET le téléphone client. */
  async track(dto: TrackOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber },
      include: ORDER_INCLUDE,
    });

    if (!order || order.customerPhone !== dto.customerPhone) {
      throw new NotFoundException(
        'Aucune commande trouvée pour ce numéro et ce téléphone.',
      );
    }

    return order;
  }

  /** Back-office : liste filtrable (statut, école, niveau, commercial, période, recherche libre). */
  async findAll(query: SearchOrderDto) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.schoolId ? { schoolId: query.schoolId } : {}),
      ...(query.gradeId ? { gradeId: query.gradeId } : {}),
      ...(query.commercialId ? { commercialId: query.commercialId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { customerName: { contains: query.search, mode: 'insensitive' } },
              { customerPhone: { contains: query.search } },
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }
    return order;
  }

  /** Édition des infos client / adresse / note — chaque champ modifié génère sa propre entrée d'historique. */
  async update(id: string, dto: UpdateOrderDto, userId: string) {
    const order = await this.findOne(id);
    this.assertNotTerminal(order.status);

    const data: Prisma.OrderUpdateInput = {};
    const historyEntries: Prisma.OrderHistoryCreateManyOrderInput[] = [];

    if (dto.deliveryAddress !== undefined && dto.deliveryAddress !== order.deliveryAddress) {
      data.deliveryAddress = dto.deliveryAddress;
      historyEntries.push({
        userId,
        action: OrderHistoryAction.ADDRESS_UPDATED,
        oldValue: order.deliveryAddress,
        newValue: dto.deliveryAddress,
      });
    }
    if (dto.note !== undefined && dto.note !== order.note) {
      data.note = dto.note;
      historyEntries.push({
        userId,
        action: OrderHistoryAction.NOTE_ADDED,
        oldValue: order.note,
        newValue: dto.note,
      });
    }
    if (dto.customerName !== undefined && dto.customerName !== order.customerName) {
      data.customerName = dto.customerName;
      historyEntries.push({
        userId,
        action: OrderHistoryAction.OTHER,
        oldValue: order.customerName,
        newValue: dto.customerName,
      });
    }
    if (dto.customerPhone !== undefined && dto.customerPhone !== order.customerPhone) {
      data.customerPhone = dto.customerPhone;
      historyEntries.push({
        userId,
        action: OrderHistoryAction.OTHER,
        oldValue: order.customerPhone,
        newValue: dto.customerPhone,
      });
    }
    if (dto.customerEmail !== undefined && dto.customerEmail !== order.customerEmail) {
      data.customerEmail = dto.customerEmail;
      historyEntries.push({
        userId,
        action: OrderHistoryAction.OTHER,
        oldValue: order.customerEmail,
        newValue: dto.customerEmail,
      });
    }
    if (dto.customerGender !== undefined && dto.customerGender !== order.customerGender) {
      data.customerGender = dto.customerGender;
    }
    if (dto.customerRole !== undefined && dto.customerRole !== order.customerRole) {
      data.customerRole = dto.customerRole;
    }

    if (Object.keys(data).length === 0) {
      return order;
    }

    await this.prisma.order.update({ where: { id }, data });
    if (historyEntries.length > 0) {
      await this.prisma.orderHistory.createMany({
        data: historyEntries.map((entry) => ({ ...entry, orderId: id })),
      });
    }
    return this.findOne(id);
  }

  /**
   * Changement de statut. Interdit toute action sur une commande déjà dans
   * un état terminal (DELIVERED / CANCELLED), et interdit de revenir en
   * arrière dans la séquence sauf pour annuler (CANCELLED, possible depuis
   * n'importe quel statut non terminal).
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string) {
    const order = await this.findOne(id);
    this.assertNotTerminal(order.status);

    if (dto.status !== OrderStatus.CANCELLED) {
      const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
      const nextIndex = STATUS_SEQUENCE.indexOf(dto.status);
      if (nextIndex === -1 || nextIndex < currentIndex) {
        throw new BadRequestException(
          `Transition de statut invalide : ${order.status} -> ${dto.status}.`,
        );
      }
    }

    if (dto.status === order.status) {
      return order;
    }

    await this.prisma.order.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.orderHistory.create({
      data: {
        orderId: id,
        userId,
        action: OrderHistoryAction.STATUS_CHANGED,
        oldValue: order.status,
        newValue: dto.status,
      },
    });
    if (dto.status === OrderStatus.CONFIRMED) {
      await this.prisma.orderHistory.create({
        data: { orderId: id, userId, action: OrderHistoryAction.ORDER_CONFIRMED },
      });
    }

    return this.findOne(id);
  }

  /** Assigne (ou réassigne) un commercial à la commande. */
  async assignCommercial(id: string, dto: AssignCommercialDto, userId: string) {
    const order = await this.findOne(id);
    this.assertNotTerminal(order.status);

    const commercial = await this.prisma.user.findUnique({ where: { id: dto.commercialId } });
    if (!commercial || !commercial.isActive) {
      throw new NotFoundException('Commercial introuvable ou désactivé.');
    }

    await this.prisma.order.update({ where: { id }, data: { commercialId: dto.commercialId } });
    await this.prisma.orderHistory.create({
      data: {
        orderId: id,
        userId,
        action: OrderHistoryAction.OTHER,
        oldValue: order.commercialId,
        newValue: dto.commercialId,
      },
    });

    return this.findOne(id);
  }

  /** Ajoute un article à une commande existante — recalcule le total, trace PRODUCT_ADDED. */
  async addItem(orderId: string, dto: CreateOrderItemDto, userId: string) {
    const order = await this.findOne(orderId);
    this.assertNotTerminal(order.status);

    const [resolved] = await this.resolveItems([dto]);

    await this.prisma.orderItem.create({ data: { ...resolved, orderId } });
    await this.prisma.orderHistory.create({
      data: {
        orderId,
        userId,
        action: OrderHistoryAction.PRODUCT_ADDED,
        newValue: `${resolved.label} x${resolved.quantity}`,
      },
    });
    await this.recomputeTotal(orderId);

    return this.findOne(orderId);
  }

  /** Modifie la quantité d'un article — trace QUANTITY_CHANGED. */
  async updateItemQuantity(orderId: string, itemId: string, dto: UpdateOrderItemDto, userId: string) {
    const order = await this.findOne(orderId);
    this.assertNotTerminal(order.status);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Article introuvable sur cette commande.');
    }

    await this.prisma.orderItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    await this.prisma.orderHistory.create({
      data: {
        orderId,
        userId,
        action: OrderHistoryAction.QUANTITY_CHANGED,
        oldValue: `${item.label} x${item.quantity}`,
        newValue: `${item.label} x${dto.quantity}`,
      },
    });
    await this.recomputeTotal(orderId);

    return this.findOne(orderId);
  }

  /** Retire un article — trace PRODUCT_REMOVED. Impossible de vider entièrement la commande. */
  async removeItem(orderId: string, itemId: string, userId: string) {
    const order = await this.findOne(orderId);
    this.assertNotTerminal(order.status);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Article introuvable sur cette commande.');
    }
    if (order.items.length === 1) {
      throw new BadRequestException('Impossible de retirer le dernier article d’une commande.');
    }

    await this.prisma.orderItem.delete({ where: { id: itemId } });
    await this.prisma.orderHistory.create({
      data: {
        orderId,
        userId,
        action: OrderHistoryAction.PRODUCT_REMOVED,
        oldValue: `${item.label} x${item.quantity}`,
      },
    });
    await this.recomputeTotal(orderId);

    return this.findOne(orderId);
  }

  // ---------------------------------------------------------------------

  private assertNotTerminal(status: OrderStatus) {
    if (TERMINAL_STATUSES.includes(status)) {
      throw new ForbiddenException(
        `Commande ${status === OrderStatus.DELIVERED ? 'déjà livrée' : 'annulée'} — plus aucune modification possible.`,
      );
    }
  }

  /**
   * Résout chaque article : si productId fourni, prix + libellé viennent
   * du catalogue et le stock est vérifié ; sinon l'article est "libre"
   * (libellé + prix fournis par le client).
   */
  private async resolveItems(items: CreateOrderItemDto[]) {
    return Promise.all(
      items.map(async (item) => {
        if (!item.productId) {
          return {
            label: item.label,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice ?? 0),
          };
        }

        const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new NotFoundException(`Produit introuvable ou inactif : ${item.productId}`);
        }

        return {
          productId: product.id,
          label: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      }),
    );
  }

  private computeTotal(items: { quantity: number; unitPrice: Prisma.Decimal }[]) {
    return items.reduce(
      (sum, item) => sum.plus(item.unitPrice.times(item.quantity)),
      new Prisma.Decimal(0),
    );
  }

  private async recomputeTotal(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const totalAmount = this.computeTotal(
      items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    );
    await this.prisma.order.update({ where: { id: orderId }, data: { totalAmount } });
  }

  /**
   * Référence humaine, ex: ELC-2026-000123 — basée sur le nombre de
   * commandes créées cette année. Une collision (concurrence) est gérée
   * par retry côté `create()`, pas par une transaction dédiée : le volume
   * attendu ne justifie pas un compteur séquentiel en base pour l'instant.
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.order.count({ where: { createdAt: { gte: startOfYear } } });
    const sequence = String(count + 1).padStart(6, '0');
    return `ELC-${year}-${sequence}`;
  }
}
