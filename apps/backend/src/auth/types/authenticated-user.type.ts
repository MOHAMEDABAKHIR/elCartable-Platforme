import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}
