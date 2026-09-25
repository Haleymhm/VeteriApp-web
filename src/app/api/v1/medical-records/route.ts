import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateMedicalRecordSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('petId');

    const where: Record<string, unknown> = {};

    if (petId) {
      where.petId = petId;
    }

    if (user.role === 'CLIENT') {
      const pets = await prisma.pet.findMany({
        where: { ownerId: user.userId },
        select: { id: true },
      });
      const petIds = pets.map(p => p.id);
      where.petId = { in: petIds };
    }

    if (user.role === 'VET') {
      where.vetId = user.userId;
    }

    const medicalRecords = await prisma.medicalRecord.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
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
        vitals: true,
        exams: true,
      },
      orderBy: { date: 'desc' },
    });

    return successResponse(medicalRecords);
  } catch (error) {
    return errorResponse('Error al obtener historial médico', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    await requireStaff();

    const body = await request.json();
    const validation = validateBody(CreateMedicalRecordSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { date, title, diagnosis, treatment, publicNotes, privateNotes, petId, vitals } = validation.data;

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return errorResponse('Mascota no encontrada');
    }

    if (user.role === 'RECEPTIONIST') {
      return forbiddenResponse();
    }

    const createData: {
      title: string;
      publicNotes: string;
      privateNotes: string | null;
      petId: string;
      vetId: string;
      date?: Date;
      diagnosis?: string | null;
      treatment?: string | null;
    } = {
      title,
      publicNotes,
      privateNotes: privateNotes || null,
      petId: petId,
      vetId: user.userId,
    };

    if (date) createData.date = date;
    if (diagnosis) createData.diagnosis = diagnosis;
    if (treatment) createData.treatment = treatment;

    const medicalRecord = await prisma.medicalRecord.create({
      data: createData,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        vitals: true,
        exams: true,
      },
    });

    if (vitals) {
      await prisma.vitalSigns.create({
        data: {
          weight: vitals.weight || null,
          temperature: vitals.temperature || null,
          heartRate: vitals.heartRate || null,
          respiratoryRate: vitals.respiratoryRate || null,
          capillaryRefillTime: vitals.capillaryRefillTime || null,
          dehydrationPercentage: vitals.dehydrationPercentage || null,
          mucousMembranes: vitals.mucousMembranes || null,
          medicalRecordId: medicalRecord.id,
        },
      });
    }

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'MedicalRecord',
      entityId: String(medicalRecord.id),
      entityType: 'MedicalRecord',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    const updatedRecord = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecord.id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        vitals: true,
        exams: true,
      },
    });

    return successResponse(updatedRecord, 'Historia médica creada exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al crear historial médico', 500);
  }
}