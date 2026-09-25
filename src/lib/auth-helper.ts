import { headers } from 'next/headers';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

interface AuthUser {
  userId: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role') as Role | null;
  const email = headersList.get('x-user-email') || headersList.get('x-user-name');

  if (!userId || !role) return null;

  return {
    userId,
    role,
    email: email || '',
    firstName: '',
    lastName: '',
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No autorizado');
  }
  return user;
}

export async function requireRole(roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('Acceso prohibido');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['ADMIN']);
}

export async function requireStaff(): Promise<AuthUser> {
  return requireRole(['ADMIN', 'VET', 'RECEPTIONIST']);
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });
}