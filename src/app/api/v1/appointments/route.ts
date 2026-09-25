import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, getCurrentUser } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateAppointmentSchema } from '@/lib/validations';
import type { AppointmentStatus } from '@prisma/client';
import { sendAppointmentCreatedEmail } from '@/lib/email';
import { validateAppointmentTime } from '@/services/settings/validate-appointment-time';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as AppointmentStatus | null;
    const vetId = searchParams.get('vetId');
    const petId = searchParams.get('petId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const pendingOnly = searchParams.get('pendingOnly');

    const where: {
      status?: AppointmentStatus;
      vetId?: string;
      petId?: string | { in: string[] };
      date?: { gte?: Date; lte?: Date };
    } = {};

    if (status) where.status = status;

    if (vetId) where.vetId = vetId;

    if (petId) where.petId = petId;

    if (dateFrom && dateTo) {
      where.date = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    } else if (pendingOnly === 'true') {
      where.status = 'PENDING';
    }

    if (user.role === 'VET') {
      where.vetId = user.userId;
    }

    if (user.role === 'CLIENT') {
      const pets = await prisma.pet.findMany({
        where: { ownerId: user.userId },
        select: { id: true },
      });
      const petIds = pets.map(p => p.id);
      where.petId = { in: petIds };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        category: true,
        pet: {
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
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return successResponse(appointments);
  } catch (error) {
    return errorResponse('Error al obtener citas', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = validateBody(CreateAppointmentSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { date, reason, categoryId, petId, vetId, notes, status } = validation.data;

    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return errorResponse('Categoría no encontrada');
    }

    const appointmentDate = date;
    if (appointmentDate < new Date()) {
      return errorResponse('No se puede agendar una cita en el pasado');
    }

    if (user.role === 'CLIENT') {
      const validation = await validateAppointmentTime(appointmentDate);
      if (!validation.allowed) {
        return errorResponse(validation.message || 'Horario no disponible', 400);
      }
    }

    if (vetId) {
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          vetId: vetId,
          date: appointmentDate,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (existingAppointment) {
        return errorResponse('El veterinario ya tiene una cita en este horario');
      }
    }

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return errorResponse('Mascota no encontrada');
    }

    if (user.role === 'CLIENT' && pet.ownerId !== user.userId) {
      return forbiddenResponse();
    }

    const appointmentStatus: AppointmentStatus = user.role === 'CLIENT' ? 'PENDING' : (status || 'CONFIRMED');

    const createData = {
      date: appointmentDate,
      reason,
      categoryId,
      status: appointmentStatus,
      notes: notes || null,
      petId: petId,
      vetId: vetId || null,
    };

    const appointment = await prisma.appointment.create({
      data: createData,
      include: {
        category: true,
        pet: {
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
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'Appointment',
      entityId: String(appointment.id),
      entityType: 'Appointment',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    sendAppointmentCreatedEmail({
      id: appointment.id,
      date: appointment.date,
      reason: appointment.reason,
      status: appointment.status,
      pet: {
        name: appointment.pet.name,
        owner: {
          firstName: appointment.pet.owner.firstName,
          lastName: appointment.pet.owner.lastName,
          email: appointment.pet.owner.email,
        },
      },
      vet: appointment.vet
        ? { firstName: appointment.vet.firstName, lastName: appointment.vet.lastName }
        : null,
      category: { name: appointment.category.name, color: appointment.category.color },
    }).catch((err) => console.error('[Email] Failed to send appointment created email:', err));

    return successResponse(appointment, 'Cita creada exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al crear cita', 500);
  }
}