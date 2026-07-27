import { api, toList } from './api';
import type {
  Category,
  CreateOrderPayload,
  DashboardOverview,
  Grade,
  Order,
  PlatformUser,
  Product,
  School,
  SchoolList,
  UserRole,
} from './types';

export async function fetchSchools(search?: string): Promise<School[]> {
  const { data } = await api.get('/schools', { params: search ? { search } : undefined });
  return toList<School>(data);
}

export async function fetchSchoolsAdmin(): Promise<School[]> {
  const { data } = await api.get('/schools/admin');
  return toList<School>(data);
}

export async function fetchProductsAdmin(): Promise<Product[]> {
  const { data } = await api.get('/products/admin');
  return toList<Product>(data);
}

export async function fetchGrades(): Promise<Grade[]> {
  const { data } = await api.get('/grades');
  return toList<Grade>(data);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories');
  return toList<Category>(data);
}

export async function fetchProducts(params?: { search?: string; categoryId?: string }): Promise<Product[]> {
  const { data } = await api.get('/products', { params });
  return toList<Product>(data);
}

export async function fetchSchoolList(schoolId: string, gradeId: string): Promise<SchoolList | null> {
  try {
    const { data } = await api.get('/school-lists', { params: { schoolId, gradeId } });
    if (Array.isArray(data)) return (data[0] as SchoolList) ?? null;
    return (data as SchoolList) ?? null;
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 404) return null;
    throw error;
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<Order>('/orders', payload);
  return data;
}

export async function trackOrder(orderNumber: string, customerPhone: string): Promise<Order> {
  const { data } = await api.post<Order>('/orders/track', { orderNumber, customerPhone });
  return data;
}

export async function fetchOrders(params?: Record<string, string | undefined>): Promise<Order[]> {
  const { data } = await api.get('/orders', { params });
  return toList<Order>(data);
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function fetchDashboard(): Promise<DashboardOverview> {
  const { data } = await api.get<DashboardOverview>('/dashboard/overview');
  return data;
}

// ==========================================================
// Utilisateurs back-office (Commerciaux gérés par Admin,
// Admins gérés par Super Admin)
// ==========================================================

export async function fetchUsers(params?: { role?: UserRole; search?: string }): Promise<PlatformUser[]> {
  const { data } = await api.get('/users', { params });
  return toList<PlatformUser>(data);
}

export async function deactivateUser(id: string): Promise<PlatformUser> {
  const { data } = await api.patch<PlatformUser>(`/users/${id}/deactivate`);
  return data;
}

export async function reactivateUser(id: string): Promise<PlatformUser> {
  const { data } = await api.patch<PlatformUser>(`/users/${id}/reactivate`);
  return data;
}

export interface InvitationResult {
  id: string;
  email: string;
  role: UserRole;
  invitationCode: string;
  expiresAt: string;
}

/** Réservé Admin/Super Admin — crée un compte Commercial en attente d'activation. */
export async function inviteCommercial(payload: {
  email: string;
  fullName: string;
  phone?: string;
}): Promise<InvitationResult> {
  const { data } = await api.post<InvitationResult>('/auth/invitations', payload);
  return data;
}

/** Réservé Super Admin — crée un compte Admin en attente d'activation. */
export async function inviteAdmin(payload: {
  email: string;
  fullName: string;
  phone?: string;
}): Promise<InvitationResult> {
  const { data } = await api.post<InvitationResult>('/auth/invitations/admin', payload);
  return data;
}

// ==========================================================
// Catégories & Niveaux (back-office Admin)
// ==========================================================

export async function fetchGradesAdmin(): Promise<Grade[]> {
  const { data } = await api.get('/grades/admin');
  return toList<Grade>(data);
}

export async function createGrade(payload: { name: string; cycle?: string; order?: number }): Promise<Grade> {
  const { data } = await api.post<Grade>('/grades', payload);
  return data;
}

export async function createCategory(payload: {
  name: string;
  slug: string;
  parentId?: string;
}): Promise<Category> {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
}

// ==========================================================
// Listes officielles (back-office Admin) — import catalogue
// ==========================================================

export interface OfficialListItemPayload {
  productId: string;
  quantity: number;
}

/**
 * Crée/remplace la liste officielle d'une école + niveau. Les articles doivent
 * obligatoirement référencer des produits catalogués actifs (validé côté API).
 */
export async function createOfficialList(payload: {
  schoolId: string;
  gradeId: string;
  items: OfficialListItemPayload[];
}): Promise<SchoolList> {
  const { data } = await api.post<SchoolList>('/school-lists/official', payload);
  return data;
}

// ==========================================================
// Uploads de fichiers (stockés sur R2, seule l'URL est persistée)
// ==========================================================

async function uploadImage<T>(url: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<T>(url, form);
  return data;
}

export function uploadProductImage(productId: string, file: File): Promise<Product> {
  return uploadImage<Product>(`/products/${productId}/image`, file);
}

export function uploadSchoolLogo(schoolId: string, file: File): Promise<School> {
  return uploadImage<School>(`/schools/${schoolId}/logo`, file);
}

export function uploadUserAvatar(userId: string, file: File): Promise<PlatformUser> {
  return uploadImage<PlatformUser>(`/users/${userId}/avatar`, file);
}
