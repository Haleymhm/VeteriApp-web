import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateVaccinationSchema } from '@/lib/validations';

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

    const vaccinations = await prisma.vaccination.findMany({
      where: { petId: id },
      orderBy: { administrationDate: 'desc' },
    });

    return successResponse(vaccinations);
  } catch (error) {
    return errorResponse('Error al obtener historial de vaccaciones', 500);
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
    const validation = validateBody(CreateVaccinationSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { vaccineName, vaccineType, administrationDate, nextDoseDate, lotNumber, manufacturer} = validation.data;

    const pet = await prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      return notFoundResponse('Mascota');
    }

    const createData = {
      vaccineName,
      vaccineType,
      administrationDate: administrationDate ?? new Date(),
      nextDoseDate: nextDoseDate ?? null,
      lotNumber: lotNumber || null,
      manufacturer: manufacturer || null,
      //veterinarian: user.userId || null,
      petId: id,
      createdById: user.userId,
    };

    const vaccination = await prisma.vaccination.create({
      data: createData,
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'Vaccination',
      entityId: String(vaccination.id),
      entityType: 'Vaccination',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    return successResponse(vaccination, 'Vacuna registrada exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al registrar vacuna', 500);
  }
}