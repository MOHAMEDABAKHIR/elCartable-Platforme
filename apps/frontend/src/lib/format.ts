import type { AnalyticsEventType, AuditAction, OrderStatus } from './types';

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

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  PDF_DOWNLOAD: 'Téléchargement PDF',
  VIEW: 'Consultation',
  EXPORT: 'Export',
};

export function auditActionColor(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-700';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-700';
    case 'DELETE':
      return 'bg-red-100 text-red-700';
    case 'LOGIN':
      return 'bg-brand-100 text-brand-700';
    case 'LOGOUT':
      return 'bg-brand-100 text-brand-500';
    case 'PDF_DOWNLOAD':
    case 'EXPORT':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-accent-300/40 text-accent-500';
  }
}

export const ANALYTICS_EVENT_LABELS: Record<AnalyticsEventType, string> = {
  PAGE_VIEW: 'Page vue',
  SCROLL: 'Défilement',
  CLICK: 'Clic',
  SCHOOL_SEARCH: "Recherche d'école",
  PRODUCT_VIEW: 'Vue produit',
  ADD_TO_CART: 'Ajout au panier',
  CART_ABANDON: 'Abandon panier',
  CONVERSION: 'Conversion',
  SEARCH: 'Recherche',
  CHECKOUT_STARTED: 'Checkout démarré',
  ORDER_CREATED: 'Commande créée',
};

export function analyticsEventColor(type: AnalyticsEventType): string {
  switch (type) {
    case 'CONVERSION':
    case 'ORDER_CREATED':
      return 'bg-green-100 text-green-700';
    case 'ADD_TO_CART':
    case 'CHECKOUT_STARTED':
      return 'bg-blue-100 text-blue-700';
    case 'CART_ABANDON':
      return 'bg-red-100 text-red-700';
    case 'SEARCH':
    case 'SCHOOL_SEARCH':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-brand-100 text-brand-700';
  }
}
