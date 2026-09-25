import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, getCurrentUser } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, UpdatePetSchema } from '@/lib/validations';

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
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        medicalRecords: {
          select: {
            id: true,
            title: true,
            publicNotes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!pet) {
      return notFoundResponse('Mascota');
    }

    if (user.role === 'CLIENT' && pet.ownerId !== user.userId) {
      return forbiddenResponse();
    }

    return successResponse(pet);
  } catch (error) {
    return errorResponse('Error al obtener mascota', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(UpdatePetSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { name, species, breed, birthDate, weight, sex, reproductiveStatus, specialCharacteristics, microchipNumber } = validation.data;

    const existingPet = await prisma.pet.findUnique({
      where: { id },
    });

    if (!existingPet) {
      return notFoundResponse('Mascota');
    }

    if (user.role === 'CLIENT' && existingPet.ownerId !== user.userId) {
      return forbiddenResponse();
    }

    const previousData: Record<string, unknown> = {
      name: existingPet.name,
      species: existingPet.species,
      breed: existingPet.breed,
      birthDate: existingPet.birthDate,
      weight: existingPet.weight,
      sex: existingPet.sex,
      reproductiveStatus: existingPet.reproductiveStatus,
      specialCharacteristics: existingPet.specialCharacteristics,
      microchipNumber: existingPet.microchipNumber,
    };

    const data: {
      name?: string;
      species?: string;
      breed?: string | null;
      birthDate?: Date | null;
      weight?: number | null;
      sex?: "MALE" | "FEMALE" | null;
      reproductiveStatus?: "FERTILE" | "STERILIZED" | "CASTRATED" | null;
      specialCharacteristics?: string | null;
      microchipNumber?: string | null;
    } = {};

    if (name) data.name = name;
    if (species) data.species = species;
    if (breed !== undefined) data.breed = breed;
    if (birthDate !== undefined) data.birthDate = birthDate;
    if (weight !== undefined) data.weight = weight;
    if (sex !== undefined) data.sex = sex;
    if (reproductiveStatus !== undefined) data.reproductiveStatus = reproductiveStatus;
    if (specialCharacteristics !== undefined) data.specialCharacteristics = specialCharacteristics;
    if (microchipNumber !== undefined) data.microchipNumber = microchipNumber;

    const pet = await prisma.pet.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      user,
      action: 'UPDATE',
      module: 'Pet',
      entityId: String(pet.id),
      entityType: 'Pet',
      ipAddress: await getClientIp(request),
      previousData,
      newData: data,
    });

    return successResponse(pet, 'Mascota actualizada exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al actualizar mascota', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const existing = await prisma.pet.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Mascota');
    }

    await createAuditLog({
      user,
      action: 'DELETE',
      module: 'Pet',
      entityId: String(existing.id),
      entityType: 'Pet',
      ipAddress: await getClientIp(request),
      previousData: existing as Record<string, unknown>,
    });

    await prisma.pet.delete({
      where: { id },
    });

    return successResponse(null, 'Mascota eliminada exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al eliminar mascota', 500);
  }
}