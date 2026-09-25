import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, UpdateUserSchema } from '@/lib/validations';
import type { Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
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

    if (!user) {
      return notFoundResponse('Usuario');
    }

    return successResponse(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al obtener usuario', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(UpdateUserSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { firstName, lastName, role, password } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return notFoundResponse('Usuario');
    }

    const previousData: Record<string, unknown> = {
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
    };

    const data: {
      firstName?: string;
      lastName?: string;
      role?: Role;
      password?: string;
    } = {};

    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      user: currentUser,
      action: 'UPDATE',
      module: 'User',
      entityId: String(user.id),
      entityType: 'User',
      ipAddress: await getClientIp(request),
      previousData,
      newData: data,
    });

    return successResponse(user, 'Usuario actualizado exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al actualizar usuario', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAdmin();

    const { id } = await params;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Usuario');
    }

    await createAuditLog({
      user: currentUser,
      action: 'DELETE',
      module: 'User',
      entityId: String(existing.id),
      entityType: 'User',
      ipAddress: await getClientIp(request),
      previousData: existing as Record<string, unknown>,
    });

    await prisma.user.delete({
      where: { id },
    });

    return successResponse(null, 'Usuario eliminado exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return notFoundResponse('Usuario');
    }
    return errorResponse('Error al eliminar usuario', 500);
  }
}