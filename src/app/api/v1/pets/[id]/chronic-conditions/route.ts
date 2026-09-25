import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateChronicConditionSchema } from '@/lib/validations';

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

    const conditions = await prisma.chronicCondition.findMany({
      where: { petId: id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(conditions);
  } catch (error) {
    return errorResponse('Error al obtener condiciones crónicas', 500);
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
    const validation = validateBody(CreateChronicConditionSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { name, type, severity, diagnosisDate, notes, isActive } = validation.data;

    const pet = await prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      return notFoundResponse('Mascota');
    }

    const createData = {
      name,
      type,
      severity: severity || null,
      diagnosisDate: diagnosisDate ?? null,
      notes: notes || null,
      isActive: isActive !== undefined ? isActive : true,
      petId: id,
    };

    const condition = await prisma.chronicCondition.create({
      data: createData,
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'ChronicCondition',
      entityId: String(condition.id),
      entityType: 'ChronicCondition',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    return successResponse(condition, 'Condición crónica registrada exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al registrar condición crónica', 500);
  }
}