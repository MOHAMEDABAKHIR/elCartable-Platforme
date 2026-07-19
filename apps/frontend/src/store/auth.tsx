import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setToken } from '../lib/api';
import type { AuthResponse, AuthUser } from '../lib/types';

const USER_KEY = 'elc.user';

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  activateInvitation: (email: string, invitationCode: string, newPassword: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const applySession = useCallback((data: AuthResponse) => {
    setToken(data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      return applySession(data);
    },
    [applySession],
  );

  // Première connexion d'un compte invité (Admin ou Commercial) : email +
  // code d'invitation reçu de l'inviteur + nouveau mot de passe. Renvoie
  // directement une session active, comme le login normal.
  const activateInvitation = useCallback(
    async (email: string, invitationCode: string, newPassword: string) => {
      const { data } = await api.post<AuthResponse>('/auth/invitations/accept', {
        email,
        invitationCode,
        newPassword,
      });
      return applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // best-effort : on nettoie la session locale quoi qu'il arrive
    }
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, login, activateInvitation, logout, isAuthenticated: user !== null }),
    [user, login, activateInvitation, logout],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  return ctx;
}
