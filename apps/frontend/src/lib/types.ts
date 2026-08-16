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
  isFeatured?: boolean; 
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
  fileUrl?: string | null;
  rawText?: string | null;
  items: SchoolListItem[];
  school?: School | null;
  grade?: Grade | null;
  updatedAt?: string;
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
  schoolListId?: string | null;
  schoolList?: SchoolList | null;
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
  schoolListId?: string;
  unitPrice?: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  schoolId?: string;
  gradeId?: string;
  schoolListId?: string;
  note?: string;
  items: CreateOrderItemPayload[];
}

export interface DashboardOverview {
  period?: {
    from?: string;
    to?: string;
  };

  orders: {
    totalOrders: number;
    totalRevenue: number;
    averageCartValue: number;
    byStatus: Record<string, number>;
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

  revenueHistory: {
    date: string;
    revenue: number;
    orders: number;
  }[];

  topProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];

  topSchools: {
    schoolId: string;
    schoolName: string;
    orders: number;
    revenue: number;
  }[];

  topCities: {
    city: string;
    orders: number;
    revenue: number;
  }[];

  topGrades: {
    gradeId: string;
    gradeName: string;
    orders: number;
    revenue: number;
  }[];

  latestOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
  }[];

  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    price: number;
  }[];

  activities: {
    id: string;
    action: string;
    orderNumber: string;
    user: string;
    createdAt: string;
  }[];
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PDF_DOWNLOAD'
  | 'VIEW'
  | 'EXPORT';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  } | null;
}

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'SCROLL'
  | 'CLICK'
  | 'SCHOOL_SEARCH'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'CART_ABANDON'
  | 'CONVERSION'
  | 'SEARCH'
  | 'CHECKOUT_STARTED'
  | 'ORDER_CREATED';

export interface AnalyticsEventEntry {
  id: string;
  type: AnalyticsEventType;
  sessionId: string;
  path?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface SchoolByCity {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}