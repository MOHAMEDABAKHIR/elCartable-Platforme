import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Construit un filtre de période Prisma à partir de deux dates ISO 8601
 * optionnelles. Renvoie `undefined` quand aucune borne n'est fournie, afin
 * de pouvoir l'insérer conditionnellement dans une clause `where` sans
 * filtrer par date.
 */
export function buildDateRangeFilter(
  from?: string,
  to?: string,
): Prisma.DateTimeFilter | undefined {
  if (!from && !to) {
    return undefined;
  }
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}

/** Filtre `contains` insensible à la casse pour les recherches texte Prisma. */
export function containsInsensitive(value: string): Prisma.StringFilter {
  return { contains: value, mode: Prisma.QueryMode.insensitive };
}

/**
 * Renvoie l'entité si elle existe, sinon lève une `NotFoundException` avec le
 * message fourni. Factorise le motif « findUnique/findFirst puis 404 »
 * répété dans la plupart des services.
 */
export function ensureFound<T>(entity: T | null | undefined, message: string): T {
  if (entity === null || entity === undefined) {
    throw new NotFoundException(message);
  }
  return entity;
}
