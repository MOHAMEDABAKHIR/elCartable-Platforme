import type { Order } from './types';

const STORAGE_KEY = 'elc.orderHistory';

export interface LocalOrderReference {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
  createdAt: string;
}

function readHistory(): LocalOrderReference[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

function writeHistory(history: LocalOrderReference[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getLocalOrderHistory(): LocalOrderReference[] {
  return readHistory();
}

export function saveOrderToHistory(order: Order) {
  const history = readHistory();

  const entry: LocalOrderReference = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt,
  };

  const alreadyExists = history.some(
    (item) => item.orderId === order.id,
  );

  if (alreadyExists) {
    return;
  }

  writeHistory([entry, ...history]);
}

export function removeOrderFromHistory(orderId: string) {
  const history = readHistory();

  writeHistory(
    history.filter((item) => item.orderId !== orderId),
  );
}

export function clearOrderHistory() {
  localStorage.removeItem(STORAGE_KEY);
}