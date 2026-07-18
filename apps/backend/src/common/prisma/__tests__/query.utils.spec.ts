import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildDateRangeFilter,
  containsInsensitive,
  ensureFound,
} from '../query.utils';

describe('buildDateRangeFilter', () => {
  it('returns undefined when neither bound is provided', () => {
    expect(buildDateRangeFilter(undefined, undefined)).toBeUndefined();
    expect(buildDateRangeFilter('', '')).toBeUndefined();
  });

  it('sets only gte when only "from" is provided', () => {
    const filter = buildDateRangeFilter('2026-01-01T00:00:00.000Z');
    expect(filter).toEqual({ gte: new Date('2026-01-01T00:00:00.000Z') });
    expect(filter).not.toHaveProperty('lte');
  });

  it('sets only lte when only "to" is provided', () => {
    const filter = buildDateRangeFilter(undefined, '2026-12-31T00:00:00.000Z');
    expect(filter).toEqual({ lte: new Date('2026-12-31T00:00:00.000Z') });
    expect(filter).not.toHaveProperty('gte');
  });

  it('sets both bounds when both are provided', () => {
    const filter = buildDateRangeFilter(
      '2026-01-01T00:00:00.000Z',
      '2026-12-31T00:00:00.000Z',
    );
    expect(filter).toEqual({
      gte: new Date('2026-01-01T00:00:00.000Z'),
      lte: new Date('2026-12-31T00:00:00.000Z'),
    });
  });
});

describe('containsInsensitive', () => {
  it('builds a case-insensitive contains filter', () => {
    expect(containsInsensitive('rabat')).toEqual({
      contains: 'rabat',
      mode: Prisma.QueryMode.insensitive,
    });
  });
});

describe('ensureFound', () => {
  it('returns the entity when present', () => {
    const entity = { id: '1' };
    expect(ensureFound(entity, 'introuvable')).toBe(entity);
  });

  it('throws NotFoundException with the message when null', () => {
    expect(() => ensureFound(null, 'introuvable')).toThrow(NotFoundException);
    expect(() => ensureFound(null, 'introuvable')).toThrow('introuvable');
  });

  it('throws NotFoundException when undefined', () => {
    expect(() => ensureFound(undefined, 'introuvable')).toThrow(NotFoundException);
  });
});
