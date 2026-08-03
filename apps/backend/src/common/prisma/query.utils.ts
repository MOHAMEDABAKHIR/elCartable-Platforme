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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Normalise `page`/`limit` en `skip`/`take` Prisma. Toujours borné (voir
 * `PaginationDto`) pour éviter qu'un `findMany` sans filtre ramène la table
 * entière — c'est ce plafond qui protège les listes qui peuvent devenir
 * volumineuses (écoles, produits, ...).
 */
export function paginationParams(
  page?: number,
  limit?: number,
  defaultLimit = 20,
): { skip: number; take: number; page: number; limit: number } {
  const take = limit ?? defaultLimit;
  const currentPage = page && page > 0 ? page : 1;
  return { skip: (currentPage - 1) * take, take, page: currentPage, limit: take };
}

/** Enveloppe `data` + métadonnées de pagination, prête à renvoyer au client. */
export function buildPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}
