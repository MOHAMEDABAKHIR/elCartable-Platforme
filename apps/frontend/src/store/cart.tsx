import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  productId?: string;
  label: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
}

export interface CartContext {
  schoolId?: string;
  gradeId?: string;
}

interface CartState {
  items: CartItem[];
  context: CartContext;
  addItem: (item: CartItem) => void;
  addMany: (items: CartItem[], context?: CartContext) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  setContext: (context: CartContext) => void;
  clear: () => void;
  totalItems: number;
  totalAmount: number;
}

const STORAGE_KEY = 'elc.cart';

const CartCtx = createContext<CartState | null>(null);

interface StoredCart {
  items: CartItem[];
  context: CartContext;
}

function load(): StoredCart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredCart;
  } catch {
    // panier corrompu -> on repart d'un panier vide
  }
  return { items: [], context: {} };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredCart>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((item: CartItem) => {
    setState((prev) => {
      const idx = prev.items.findIndex(
        (i) => i.productId === item.productId && i.label === item.label,
      );
      if (idx >= 0) {
        const items = [...prev.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
        return { ...prev, items };
      }
      return { ...prev, items: [...prev.items, item] };
    });
  }, []);

  const addMany = useCallback((items: CartItem[], context?: CartContext) => {
    setState((prev) => ({
      items: [...prev.items, ...items],
      context: context ?? prev.context,
    }));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setState((prev) => {
      const items = [...prev.items];
      if (!items[index]) return prev;
      items[index] = { ...items[index], quantity: Math.max(1, quantity) };
      return { ...prev, items };
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }, []);

  const setContext = useCallback((context: CartContext) => {
    setState((prev) => ({ ...prev, context: { ...prev.context, ...context } }));
  }, []);

  const clear = useCallback(() => setState({ items: [], context: {} }), []);

  const value = useMemo<CartState>(() => {
    const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return {
      items: state.items,
      context: state.context,
      addItem,
      addMany,
      updateQuantity,
      removeItem,
      setContext,
      clear,
      totalItems,
      totalAmount,
    };
  }, [state, addItem, addMany, updateQuantity, removeItem, setContext, clear]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider.');
  return ctx;
}
