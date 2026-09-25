import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateDewormingSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const pet = await prisma.pet.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!pet) {
      return notFoundResponse('Mascota');
    }

    if (user.role === 'CLIENT' && pet.ownerId !== user.userId) {
      return forbiddenResponse();
    }

    const dewormingRecords = await prisma.deworming.findMany({
      where: { petId: id },
      orderBy: { date: 'desc' },
    });

    return successResponse(dewormingRecords);
  } catch (error) {
    return errorResponse('Error al obtener historial de desparasitación', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    await requireStaff();

    if (user.role === 'RECEPTIONIST') {
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(CreateDewormingSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { productName, type, dosage, date, nextDate } = validation.data;

    const pet = await prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      return notFoundResponse('Mascota');
    }

    const createData = {
      productName,
      type,
      dosage: dosage || null,
      date: date ?? new Date(),
      nextDate: nextDate ?? null,
      petId: id,
      createdById: user.userId,
    };

    const deworming = await prisma.deworming.create({
      data: createData,
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'Deworming',
      entityId: String(deworming.id),
      entityType: 'Deworming',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    return successResponse(deworming, 'Desparasitación registrada exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al registrar desparasitación', 500);
  }
}