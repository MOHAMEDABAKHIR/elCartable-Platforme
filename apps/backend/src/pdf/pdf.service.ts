import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, OrderHistoryAction, Prisma } from '@prisma/client';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { ensureFound } from '../common/prisma/query.utils';

const ORDER_INCLUDE = {
  items: true,
  school: true,
  grade: true,
} satisfies Prisma.OrderInclude;

type OrderForPdf = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

// Charte graphique elCartable (cf. ARCHITECTURE.md §5).
const VIOLET = rgb(0.627, 0.565, 0.8); // #A090CC
const JAUNE = rgb(0.957, 0.773, 0.259); // #F4C542
const TEXT = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.45, 0.45, 0.45);

/**
 * Génère la fiche de commande PDF (+ QR Code de suivi) qui renseigne
 * `Order.pdfUrl` / `Order.qrCodeUrl`, laissés `null` par le module Orders.
 * Le QR encode l'URL publique de suivi ; la saisie du téléphone y reste
 * exigée côté suivi, le QR n'expose donc aucune donnée client.
 */
@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Génère (ou régénère) le PDF d'une commande, le persiste sur disque,
   * renseigne `pdfUrl`/`qrCodeUrl` et trace le téléchargement. Renvoie le
   * buffer pour un streaming direct par le contrôleur.
   */
  async getOrderPdf(orderId: string, actorId?: string): Promise<{ order: OrderForPdf; pdf: Buffer }> {
    const order = ensureFound(
      await this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE }),
      'Commande introuvable.',
    );

    const { pdf, qr } = await this.buildOrderPdf(order);

    // Envoi vers Cloudflare R2 (dossier `orders/`) — repli disque local si R2
    // n'est pas configuré. Nom idempotent basé sur le numéro de commande :
    // une régénération écrase proprement le fichier précédent.
    const [pdfStored, qrStored] = await Promise.all([
      this.storage.upload({
        buffer: pdf,
        folder: 'orders',
        baseName: order.orderNumber,
        mimeType: 'application/pdf',
      }),
      this.storage.upload({
        buffer: qr,
        folder: 'orders',
        baseName: `${order.orderNumber}-qr`,
        mimeType: 'image/png',
      }),
    ]);

    const pdfUrl = pdfStored.url;
    const qrCodeUrl = qrStored.url;
    const firstGeneration = !order.pdfUrl;

    await this.prisma.order.update({ where: { id: order.id }, data: { pdfUrl, qrCodeUrl } });

    // Première génération -> trace sur la timeline métier de la commande.
    if (firstGeneration && actorId) {
      await this.prisma.orderHistory.create({
        data: { orderId: order.id, userId: actorId, action: OrderHistoryAction.PDF_GENERATED },
      });
    }

    await this.audit.log({
      action: AuditAction.PDF_DOWNLOAD,
      userId: actorId,
      entityType: 'Order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber },
    });

    return { order: { ...order, pdfUrl, qrCodeUrl }, pdf };
  }

  /** Construit le PDF et le QR en mémoire — pur, sans I/O disque ni DB. */
  async buildOrderPdf(order: OrderForPdf): Promise<{ pdf: Buffer; qr: Buffer }> {
    const trackingUrl = `${this.config.get<string>('frontendUrl', '')}/suivi?commande=${order.orderNumber}`;
    const qr = await QRCode.toBuffer(trackingUrl, { width: 240, margin: 1 });

    const doc = await PDFDocument.create();
    doc.setTitle(`Fiche de commande ${order.orderNumber}`);
    const page = doc.addPage([595, 842]); // A4 en points
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const qrImage = await doc.embedPng(qr);

    const { width, height } = page.getSize();
    const margin = 48;

    // Bandeau d'en-tête
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: VIOLET });
    page.drawText('elCartable', { x: margin, y: height - 48, size: 24, font: bold, color: rgb(1, 1, 1) });
    page.drawText('Fiche de commande', { x: margin, y: height - 72, size: 12, font, color: rgb(1, 1, 1) });

    // QR + numéro en haut à droite
    const qrSize = 96;
    page.drawImage(qrImage, { x: width - margin - qrSize, y: height - 90 - qrSize - 10, width: qrSize, height: qrSize });
    page.drawText(order.orderNumber, {
      x: width - margin - qrSize,
      y: height - 90 - qrSize - 24,
      size: 10,
      font: bold,
      color: TEXT,
    });

    let y = height - 140;
    const line = (label: string, value: string) => {
      page.drawText(label, { x: margin, y, size: 9, font, color: MUTED });
      page.drawText(value || '—', { x: margin, y: y - 13, size: 11, font: bold, color: TEXT });
      y -= 34;
    };

    line('Client', order.customerName);
    line('Téléphone', order.customerPhone);
    line('Adresse de livraison', order.deliveryAddress ?? '');
    line('École / Niveau', `${order.school?.name ?? '—'} · ${order.grade?.name ?? '—'}`);

    // Tableau des articles
    y -= 6;
    page.drawText('Articles', { x: margin, y, size: 12, font: bold, color: VIOLET });
    y -= 8;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: JAUNE });
    y -= 22;

    const colQty = width - margin - 220;
    const colPrice = width - margin - 120;
    const colTotal = width - margin - 10;
    this.drawRow(page, font, bold, y, 'Désignation', 'Qté', 'P.U.', 'Total', true, { margin, colQty, colPrice, colTotal });
    y -= 18;

    for (const item of order.items) {
      const lineTotal = item.unitPrice.times(item.quantity);
      this.drawRow(
        page,
        font,
        bold,
        y,
        item.label,
        String(item.quantity),
        this.money(item.unitPrice),
        this.money(lineTotal),
        false,
        { margin, colQty, colPrice, colTotal },
      );
      y -= 16;
    }

    y -= 8;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: JAUNE });
    y -= 22;
    page.drawText('Total à payer', { x: colQty, y, size: 12, font: bold, color: TEXT });
    page.drawText(this.money(order.totalAmount), {
      x: colTotal - bold.widthOfTextAtSize(this.money(order.totalAmount), 12),
      y,
      size: 12,
      font: bold,
      color: VIOLET,
    });

    page.drawText('Paiement à la livraison — merci pour votre confiance.', {
      x: margin,
      y: 48,
      size: 9,
      font,
      color: MUTED,
    });

    const bytes = await doc.save();
    return { pdf: Buffer.from(bytes), qr };
  }

  private drawRow(
    page: PDFPage,
    font: PDFFont,
    bold: PDFFont,
    y: number,
    label: string,
    qty: string,
    price: string,
    total: string,
    header: boolean,
    cols: { margin: number; colQty: number; colPrice: number; colTotal: number },
  ) {
    const size = header ? 9 : 10;
    const f = header ? bold : font;
    const color = header ? MUTED : TEXT;
    page.drawText(this.truncate(label, 42), { x: cols.margin, y, size, font: f, color });
    page.drawText(qty, { x: cols.colQty, y, size, font: f, color });
    page.drawText(price, { x: cols.colPrice, y, size, font: f, color });
    page.drawText(total, { x: cols.colTotal - f.widthOfTextAtSize(total, size), y, size, font: f, color });
  }

  private money(value: Prisma.Decimal): string {
    return `${value.toFixed(2)} MAD`;
  }

  private truncate(value: string, max: number): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }
}
