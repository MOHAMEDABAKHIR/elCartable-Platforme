import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SchoolListSource } from '@prisma/client';
import { SchoolListsService } from '../school-lists.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SchoolListsService', () => {
  let service: SchoolListsService;
  let prisma: {
    schoolList: Record<string, jest.Mock>;
    schoolListItem: Record<string, jest.Mock>;
    product: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      schoolList: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      schoolListItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [SchoolListsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SchoolListsService);
  });

  describe('Scénario 1 — liste officielle', () => {
    it('throws NotFoundException when no official list exists for school+grade', async () => {
      prisma.schoolList.findFirst.mockResolvedValue(null);

      await expect(service.findOfficialList('school-1', 'grade-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the official list with its items when found', async () => {
      const list = { id: 'list-1', items: [{ id: 'item-1', label: 'Cahier', quantity: 2 }] };
      prisma.schoolList.findFirst.mockResolvedValue(list);

      const result = await service.findOfficialList('school-1', 'grade-1');

      expect(prisma.schoolList.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: 'school-1',
            gradeId: 'grade-1',
            source: SchoolListSource.OFFICIAL,
            isActive: true,
          }),
        }),
      );
      expect(result).toBe(list);
    });
  });

  describe('Scénario 1 — création liste officielle (import catalogue)', () => {
    it('rejette un article dont le produit n\'existe pas / est inactif', async () => {
      prisma.product.findMany.mockResolvedValue([]); // aucun produit trouvé

      await expect(
        service.createOrReplaceOfficialList({
          schoolId: 'school-1',
          gradeId: 'grade-1',
          items: [{ productId: 'ghost', quantity: 2 }],
        } as any),
      ).rejects.toThrow(BadRequestException);
      // On ne détruit jamais la liste existante avant validation.
      expect(prisma.schoolListItem.deleteMany).not.toHaveBeenCalled();
    });

    it('crée la liste avec des libellés dérivés du catalogue', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Cahier 96 pages' },
      ]);
      prisma.schoolList.findFirst.mockResolvedValue(null);
      prisma.schoolList.create.mockResolvedValue({ id: 'list-1', items: [] });

      await service.createOrReplaceOfficialList({
        schoolId: 'school-1',
        gradeId: 'grade-1',
        items: [{ productId: 'p1', quantity: 3 }],
      } as any);

      expect(prisma.schoolList.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: { create: [{ productId: 'p1', label: 'Cahier 96 pages', quantity: 3 }] },
          }),
        }),
      );
    });
  });

  describe('Scénario 2 — liste personnalisée', () => {
    it('throws when source is manual but rawText is missing', async () => {
      await expect(
        service.submitCustomList({ source: SchoolListSource.CUSTOM_MANUAL } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when source is photo but fileUrl is missing', async () => {
      await expect(
        service.submitCustomList({ source: SchoolListSource.CUSTOM_PHOTO } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a custom list when manual text is provided', async () => {
      prisma.schoolList.create.mockResolvedValue({ id: 'list-2' });

      await service.submitCustomList({
        source: SchoolListSource.CUSTOM_MANUAL,
        rawText: '2 cahiers, 1 trousse',
      } as any);

      expect(prisma.schoolList.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: SchoolListSource.CUSTOM_MANUAL,
            rawText: '2 cahiers, 1 trousse',
          }),
        }),
      );
    });

    it('creates a custom list when a photo fileUrl is provided', async () => {
      prisma.schoolList.create.mockResolvedValue({ id: 'list-3' });

      await service.submitCustomList({
        source: SchoolListSource.CUSTOM_PHOTO,
        fileUrl: '/uploads/photo123.jpg',
      } as any);

      expect(prisma.schoolList.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: SchoolListSource.CUSTOM_PHOTO,
            fileUrl: '/uploads/photo123.jpg',
          }),
        }),
      );
    });
  });
});
