import { api, toList } from './api';
import type {
  Category,
  CreateOrderPayload,
  DashboardOverview,
  Grade,
  Order,
  Product,
  School,
  SchoolList,
} from './types';

export async function fetchSchools(search?: string): Promise<School[]> {
  const { data } = await api.get('/schools', { params: search ? { search } : undefined });
  return toList<School>(data);
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
