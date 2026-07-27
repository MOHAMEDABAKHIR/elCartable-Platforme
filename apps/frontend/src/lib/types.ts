export type UserRole = 'COMMERCIAL' | 'ADMIN' | 'SUPER_ADMIN';

export type OrderStatus =
  | 'CREATED'
  | 'AWAITING_CALL'
  | 'CALLING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export type CustomerRole = 'PARENT' | 'STUDENT' | 'OTHER';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type SchoolListSource =
  | 'OFFICIAL'
  | 'CUSTOM_PHOTO'
  | 'CUSTOM_FILE'
  | 'CUSTOM_MANUAL';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  mustSetPassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface School {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface Grade {
  id: string;
  name: string;
  cycle?: string | null;
  order: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  imageUrl?: string | null;
  stock?: number | null;
  categoryId?: string | null;
  category?: Category | null;
  isActive: boolean;
}

export interface SchoolListItem {
  id: string;
  productId?: string | null;
  label: string;
  quantity: number;
  product?: Product | null;
}

export interface SchoolList {
  id: string;
  schoolId?: string | null;
  gradeId?: string | null;
  source: SchoolListSource;
  items: SchoolListItem[];
}

export interface OrderItem {
  id: string;
  productId?: string | null;
  label: string;
  quantity: number;
  unitPrice: string | number;
}

export interface OrderHistoryEntry {
  id: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress?: string | null;
  status: OrderStatus;
  totalAmount: string | number;
  commercialId?: string | null;
  commercial?: { id: string; fullName: string; email: string } | null;
  school?: School | null;
  grade?: Grade | null;
  items: OrderItem[];
  history?: OrderHistoryEntry[];
  pdfUrl?: string | null;
  qrCodeUrl?: string | null;
  createdAt: string;
}

export interface CreateOrderItemPayload {
  productId?: string;
  label: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  schoolId?: string;
  gradeId?: string;
  note?: string;
  items: CreateOrderItemPayload[];
}

export interface DashboardOverview {
  orders: {
    totalOrders: number;
    byStatus: Record<string, number>;
    totalRevenue: number | string;
    averageCartValue: number | string;
    nonCancelledOrders: number;
  };
  visitors: {
    sessionsCount: number;
    newVisitorsCount: number;
    addToCartSessions: number;
    convertedSessions: number;
    abandonmentRate: number;
    averageTimeToConversionSeconds: number | null;
  };
}

export interface Paginated<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}
