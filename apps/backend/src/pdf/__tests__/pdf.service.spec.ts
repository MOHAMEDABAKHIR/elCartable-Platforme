import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PdfService } from '../pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { StorageService } from '../../storage/storage.service';

function buildOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ELC-2026-000123',
    customerName: 'Fatima Zahra',
    customerPhone: '0600000000',
    deliveryAddress: '12 rue des Écoles, Casablanca',
    totalAmount: new Prisma.Decimal(150),
    pdfUrl: null,
    qrCodeUrl: null,
    school: { name: 'École Al Amal' },
    grade: { name: 'CE2' },
    items: [
      { label: 'Cahier 96 pages', quantity: 3, unitPrice: new Prisma.Decimal(10) },
      { label: 'Stylo bleu', quantity: 12, unitPrice: new Prisma.Decimal(10) },
    ],
    ...overrides,
  };
}

describe('PdfService', () => {
  let service: PdfService;
  let prisma: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    orderHistory: { create: jest.Mock };
  };
  let audit: { log: jest.Mock };
  let storage: { upload: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(buildOrder()),
        update: jest.fn().mockResolvedValue({}),
      },
      orderHistory: { create: jest.fn().mockResolvedValue({}) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    storage = {
      upload: jest.fn(async ({ folder, baseName, mimeType }) => {
        const ext = mimeType === 'application/pdf' ? '.pdf' : '.png';
        const key = `${folder}/${baseName}${ext}`;
        return { url: `/uploads/${key}`, key };
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PdfService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: StorageService, useValue: storage },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, fallback?: unknown) => fallback) },
        },
      ],
    }).compile();

    service = moduleRef.get(PdfService);
  });

  describe('buildOrderPdf', () => {
    it('produces a PDF buffer and a PNG QR code buffer', async () => {
      const { pdf, qr } = await service.buildOrderPdf(buildOrder() as never);

      expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
      // PNG signature
      expect(Array.from(qr.subarray(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
    });
  });

  describe('getOrderPdf', () => {
    it('throws when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.getOrderPdf('missing')).rejects.toThrow(NotFoundException);
    });

    it('persists the files, sets pdfUrl/qrCodeUrl and logs a PDF_DOWNLOAD audit entry', async () => {
      const { pdf } = await service.getOrderPdf('order-1', 'user-1');

      expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
      expect(storage.upload).toHaveBeenCalledTimes(2);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          pdfUrl: '/uploads/orders/ELC-2026-000123.pdf',
          qrCodeUrl: '/uploads/orders/ELC-2026-000123-qr.png',
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PDF_DOWNLOAD', entityType: 'Order', entityId: 'order-1' }),
      );
    });

    it('records a PDF_GENERATED history entry on first generation only', async () => {
      await service.getOrderPdf('order-1', 'user-1');
      expect(prisma.orderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orderId: 'order-1', action: 'PDF_GENERATED' }),
        }),
      );
    });

    it('does not duplicate the history entry when the PDF already exists', async () => {
      prisma.order.findUnique.mockResolvedValue(
        buildOrder({ pdfUrl: '/uploads/orders/ELC-2026-000123.pdf' }),
      );
      await service.getOrderPdf('order-1', 'user-1');
      expect(prisma.orderHistory.create).not.toHaveBeenCalled();
    });
  });
});
