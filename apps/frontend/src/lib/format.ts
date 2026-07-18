import type { OrderStatus } from './types';

export function formatMAD(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Créée',
  AWAITING_CALL: "En attente d'appel",
  CALLING: 'Appel en cours',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  DELIVERING: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'CREATED',
  'AWAITING_CALL',
  'CALLING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERING',
  'DELIVERED',
];

export function orderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    case 'DELIVERING':
    case 'READY':
      return 'bg-blue-100 text-blue-700';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'bg-brand-100 text-brand-700';
    default:
      return 'bg-accent-300/40 text-accent-500';
  }
}
