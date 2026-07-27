import { BadRequestException, Injectable } from '@nestjs/common';
import { SchoolListSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ensureFound } from '../common/prisma/query.utils';
import { CreateOfficialSchoolListDto } from './dto/create-official-school-list.dto';
import { SubmitCustomSchoolListDto } from './dto/submit-custom-school-list.dto';

@Injectable()
export class SchoolListsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scénario 1 : le visiteur a choisi une école + un niveau existants.
   * On retourne la liste officielle correspondante avec ses articles
   * (produit catalogué si dispo, sinon libellé libre + quantité).
   */
  async findOfficialList(schoolId: string, gradeId: string) {
    const list = await this.prisma.schoolList.findFirst({
      where: {
        schoolId,
        gradeId,
        source: SchoolListSource.OFFICIAL,
        isActive: true,
      },
      include: {
        items: { include: { product: true } },
        school: true,
        grade: true,
      },
    });

    return ensureFound(
      list,
      "Aucune liste officielle trouvée pour cette école et ce niveau. Le client peut soumettre une liste personnalisée (scénario 2).",
    );
  }

  /**
   * Admin : crée ou remplace la liste officielle d'une école + niveau.
   *
   * Contrainte métier : la liste est *importée depuis le catalogue*. Chaque
   * article doit référencer un produit catalogué actif ; le libellé stocké est
   * dérivé du nom du produit (snapshot). On rejette tout `productId` inconnu ou
   * désactivé pour garantir qu'une liste officielle ne contient que des
   * articles réellement commandables.
   */
  async createOrReplaceOfficialList(dto: CreateOfficialSchoolListDto) {
    const itemsData = await this.resolveCataloguedItems(dto.items);

    const existing = await this.prisma.schoolList.findFirst({
      where: {
        schoolId: dto.schoolId,
        gradeId: dto.gradeId,
        source: SchoolListSource.OFFICIAL,
      },
    });

    if (existing) {
      // Replace items entirely — previous version is not needed as history
      // here (unlike orders): this is catalogue data, not client-facing state.
      await this.prisma.schoolListItem.deleteMany({ where: { schoolListId: existing.id } });
      await this.prisma.schoolListItem.createMany({
        data: itemsData.map((item) => ({ schoolListId: existing.id, ...item })),
      });
      return this.findOfficialList(dto.schoolId, dto.gradeId);
    }

    const created = await this.prisma.schoolList.create({
      data: {
        schoolId: dto.schoolId,
        gradeId: dto.gradeId,
        source: SchoolListSource.OFFICIAL,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    return created;
  }

  /**
   * Valide que tous les `productId` existent et sont actifs, puis renvoie les
   * lignes prêtes à insérer avec le libellé dérivé du catalogue.
   */
  private async resolveCataloguedItems(
    items: CreateOfficialSchoolListDto['items'],
  ): Promise<Array<{ productId: string; label: string; quantity: number }>> {
    const ids = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, name: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const invalid = ids.filter((id) => !byId.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Article(s) introuvable(s) ou inactif(s) dans le catalogue : ${invalid.join(', ')}. Une liste officielle ne peut contenir que des produits catalogués.`,
      );
    }

    return items.map((item) => ({
      productId: item.productId,
      label: byId.get(item.productId)!.name,
      quantity: item.quantity,
    }));
  }

  /**
   * Scénario 2 : l'école n'existe pas dans le catalogue. Le client envoie
   * une photo, un fichier, ou saisit sa liste manuellement. On stocke la
   * soumission telle quelle — elle sera traitée manuellement par un
   * commercial lors de la confirmation de commande.
   */
  async submitCustomList(dto: SubmitCustomSchoolListDto) {
    if (dto.source === SchoolListSource.CUSTOM_MANUAL && !dto.rawText) {
      throw new BadRequestException('rawText est requis pour une liste saisie manuellement.');
    }
    if (dto.source !== SchoolListSource.CUSTOM_MANUAL && !dto.fileUrl) {
      throw new BadRequestException('fileUrl est requis pour une liste envoyée en photo ou en fichier.');
    }

    return this.prisma.schoolList.create({
      data: {
        schoolId: dto.schoolId,
        gradeId: dto.gradeId,
        source: dto.source,
        fileUrl: dto.fileUrl,
        rawText: dto.rawText,
      },
    });
  }

  async findOne(id: string) {
    const list = await this.prisma.schoolList.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, school: true, grade: true },
    });
    return ensureFound(list, 'Liste scolaire introuvable.');
  }
}
