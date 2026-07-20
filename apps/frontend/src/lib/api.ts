import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from './types';

const TOKEN_KEY = 'elc.accessToken';
const REFRESH_TOKEN_KEY = 'elc.refreshToken';

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

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Vide toute la session (access + refresh token) côté client. */
export function clearTokens(): void {
  setToken(null);
  setRefreshToken(null);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Rafraîchissement automatique du JWT
// ---------------------------------------------------------------------------

/**
 * Handler appelé quand la session est définitivement expirée (refresh token
 * absent, invalide ou lui-même expiré). Enregistré par l'AuthProvider pour
 * vider l'état React ; ProtectedRoute redirige alors vers /connexion.
 */
type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function onSessionExpired(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler;
}

function handleSessionExpired(): void {
  clearTokens();
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
  } else if (typeof window !== 'undefined') {
    // Filet de sécurité si aucun handler React n'est enregistré.
    window.location.assign('/connexion');
  }
}

/** Endpoints d'auth qui ne doivent jamais déclencher de refresh sur un 401. */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/invitations/accept')
  );
}

/**
 * Un seul appel `/auth/refresh` à la fois : toutes les requêtes tombées en 401
 * pendant qu'un refresh est en cours attendent la même promesse, puis sont
 * rejouées avec le nouveau token — ce qui évite les appels concurrents
 * multiples et les boucles.
 */
let refreshPromise: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Aucun refresh token disponible.');
  }
  // Instance axios "nue" (sans intercepteurs) pour éviter toute récursion.
  const { data } = await axios.post<AuthResponse>(
    `${api.defaults.baseURL ?? ''}/auth/refresh`,
    { refreshToken },
  );
  setToken(data.accessToken);
  setRefreshToken(data.refreshToken ?? null);
  return data.accessToken;
}

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    // On ne tente un refresh que pour un vrai 401 d'access token expiré, une
    // seule fois par requête (`_retry`), et jamais sur les endpoints d'auth.
    if (status !== 401 || !original || original._retry || isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const newAccessToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshError) {
      // Refresh échoué => session morte : on nettoie et on redirige.
      handleSessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

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
