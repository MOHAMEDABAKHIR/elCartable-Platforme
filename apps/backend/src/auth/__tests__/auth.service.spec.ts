import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => fallback ?? 'test-value'),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('validateCredentials', () => {
    it('returns null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateCredentials('a@a.com', 'password123');
      expect(result).toBeNull();
    });

    it('returns null when user has no password set yet (pending invitation)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'a@a.com',
        password: null,
        isActive: true,
      });
      const result = await service.validateCredentials('a@a.com', 'password123');
      expect(result).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const hashed = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'a@a.com',
        password: hashed,
        isActive: true,
        role: UserRole.COMMERCIAL,
        fullName: 'Test',
      });
      const result = await service.validateCredentials('a@a.com', 'wrong-password');
      expect(result).toBeNull();
    });

    it('returns the user when credentials are valid', async () => {
      const hashed = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'a@a.com',
        password: hashed,
        isActive: true,
        role: UserRole.COMMERCIAL,
        fullName: 'Test',
      });
      const result = await service.validateCredentials('a@a.com', 'correct-password');
      expect(result).toEqual({
        id: '1',
        email: 'a@a.com',
        role: UserRole.COMMERCIAL,
        fullName: 'Test',
      });
    });
  });

  describe('inviteCommercial', () => {
    it('throws when a user with this email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.inviteCommercial(
          { email: 'a@a.com', fullName: 'Test' },
          'admin-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a commercial with mustSetPassword=true and an invitation code', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: '2',
        email: 'commercial@a.com',
      });

      const result = await service.inviteCommercial(
        { email: 'commercial@a.com', fullName: 'Commercial Test' },
        'admin-id',
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'commercial@a.com',
            role: UserRole.COMMERCIAL,
            mustSetPassword: true,
            createdById: 'admin-id',
          }),
        }),
      );
      expect(result.invitationCode).toBeDefined();
    });
  });

  describe('acceptInvitation', () => {
    it('throws when invitation code is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        mustSetPassword: true,
        invitationCode: 'RIGHTCODE',
        invitationExpires: new Date(Date.now() + 1000 * 60 * 60),
      });

      await expect(
        service.acceptInvitation({
          email: 'commercial@a.com',
          invitationCode: 'WRONGCODE',
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when invitation code has expired', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        mustSetPassword: true,
        invitationCode: 'RIGHTCODE',
        invitationExpires: new Date(Date.now() - 1000), // expired
      });

      await expect(
        service.acceptInvitation({
          email: 'commercial@a.com',
          invitationCode: 'RIGHTCODE',
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('sets the password and clears invitation fields on success', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        email: 'commercial@a.com',
        mustSetPassword: true,
        invitationCode: 'RIGHTCODE',
        invitationExpires: new Date(Date.now() + 1000 * 60 * 60),
        role: UserRole.COMMERCIAL,
        fullName: 'Commercial Test',
      });
      prisma.user.update.mockResolvedValue({
        id: '2',
        email: 'commercial@a.com',
        role: UserRole.COMMERCIAL,
        fullName: 'Commercial Test',
      });

      const result = await service.acceptInvitation({
        email: 'commercial@a.com',
        invitationCode: 'RIGHTCODE',
        newPassword: 'NewPass123',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mustSetPassword: false,
            invitationCode: null,
            invitationExpires: null,
          }),
        }),
      );
      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });
});
