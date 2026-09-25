import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, getCurrentUser } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreatePetSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const ownerId = searchParams.get('ownerId');

    const where: {
      name?: { contains: string; mode: 'insensitive' };
      ownerId?: string;
    } = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (user.role === 'CLIENT') {
      where.ownerId = user.userId;
    }

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pet.count({ where }),
    ]);

    return successResponse({
      data: pets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse('Error al obtener mascotas', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = validateBody(CreatePetSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { name, species, breed, birthDate, weight, sex, reproductiveStatus, specialCharacteristics, microchipNumber, ownerId } = validation.data;

    let petOwnerId: string;

    if (user.role === 'CLIENT') {
      petOwnerId = user.userId;
    } else if (ownerId) {
      await requireStaff();
      petOwnerId = ownerId;
    } else {
      return errorResponse('ownerId es requerido');
    }

    const createData = {
      name,
      species,
      breed: breed || null,
      birthDate: birthDate ?? null,
      weight: weight || null,
      sex: sex || null,
      reproductiveStatus: reproductiveStatus || null,
      specialCharacteristics: specialCharacteristics || null,
      microchipNumber: microchipNumber || null,
      ownerId: petOwnerId,
    };

    const pet = await prisma.pet.create({
      data: createData,
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
      action: 'CREATE',
      module: 'Pet',
      entityId: String(pet.id),
      entityType: 'Pet',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    return successResponse(pet, 'Mascota creada exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al crear mascota', 500);
  }
}