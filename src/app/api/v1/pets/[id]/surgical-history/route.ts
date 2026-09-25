import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateSurgicalHistorySchema } from '@/lib/validations';

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

    const surgicalHistory = await prisma.surgicalHistory.findMany({
      where: { petId: id },
      orderBy: { date: 'desc' },
    });

    return successResponse(surgicalHistory);
  } catch (error) {
    return errorResponse('Error al obtener antecedentes quirúrgicos', 500);
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
    const validation = validateBody(CreateSurgicalHistorySchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { procedure, date, complications, notes, outcomes } = validation.data;

    const pet = await prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      return notFoundResponse('Mascota');
    }

    const createData = {
      procedure,
      date: date ?? null,
      complications: complications || null,
      notes: notes || null,
      outcomes: outcomes || null,
      petId: id,
    };

    const surgicalRecord = await prisma.surgicalHistory.create({
      data: createData,
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'SurgicalHistory',
      entityId: String(surgicalRecord.id),
      entityType: 'SurgicalHistory',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    return successResponse(surgicalRecord, 'Antecedente quirúrgico registrado exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al registrar antecedente quirúrgico', 500);
  }
}