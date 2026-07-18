import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdentifyVisitorDto } from './dto/identify-visitor.dto';
import { StartVisitorSessionDto } from './dto/start-visitor-session.dto';
import { EndVisitorSessionDto } from './dto/end-visitor-session.dto';
import { SearchVisitorDto } from './dto/search-visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * L'IP n'est jamais stockée en clair : on ne garde qu'un hash salé, côté
   * serveur (jamais fourni par le client), pour rester conforme à l'objectif
   * d'anonymisation du visiteur.
   */
  hashIp(ip?: string): string | undefined {
    if (!ip) {
      return undefined;
    }
    const salt = this.configService.get<string>('privacy.ipHashSalt');
    return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
  }

  /** Crée le visiteur au premier contact, sinon met juste à jour lastSeen/userAgent. */
  async identify(dto: IdentifyVisitorDto, ip?: string) {
    return this.prisma.visitor.upsert({
      where: { anonId: dto.anonId },
      create: {
        anonId: dto.anonId,
        userAgent: dto.userAgent,
        ipHash: this.hashIp(ip),
      },
      update: {
        userAgent: dto.userAgent ?? undefined,
      },
    });
  }

  /** Démarre une nouvelle session ; crée le visiteur au passage s'il n'existe pas encore. */
  async startSession(dto: StartVisitorSessionDto, ip?: string) {
    const visitor = await this.identify(
      { anonId: dto.anonId, userAgent: dto.userAgent },
      ip,
    );

    return this.prisma.visitorSession.create({
      data: {
        visitorId: visitor.id,
        entryPage: dto.entryPage,
      },
    });
  }

  async endSession(sessionId: string, dto: EndVisitorSessionDto) {
    const session = await this.prisma.visitorSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Session visiteur introuvable.');
    }
    return this.prisma.visitorSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date(), exitPage: dto.exitPage },
    });
  }

  /** Back-office (Admin/SuperAdmin) : liste des visiteurs avec compteur de sessions. */
  async findAll(query: SearchVisitorDto) {
    const where: Prisma.VisitorWhereInput = {
      ...(query.anonId ? { anonId: { contains: query.anonId } } : {}),
      ...(query.from || query.to
        ? {
            firstSeen: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.visitor.findMany({
      where,
      include: { _count: { select: { sessions: true } } },
      orderBy: { lastSeen: 'desc' },
    });
  }

  async findOne(id: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id },
      include: { sessions: { orderBy: { startedAt: 'desc' }, include: { _count: { select: { events: true } } } } },
    });
    if (!visitor) {
      throw new NotFoundException('Visiteur introuvable.');
    }
    return visitor;
  }
}
