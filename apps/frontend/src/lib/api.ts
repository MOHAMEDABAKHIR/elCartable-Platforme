import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'elc.accessToken';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1/v1',
});

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Extrait un message d'erreur lisible d'une réponse d'API Nest. */
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(' ') : data.message;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Certains endpoints renvoient un tableau brut, d'autres un objet paginé
 * `{ data: [...] }`. Ce helper normalise vers un tableau.
 */
export function toList<T>(payload: T[] | { data: T[] } | undefined | null): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as { data?: T[] }).data)) return (payload as { data: T[] }).data;
  return [];
}
