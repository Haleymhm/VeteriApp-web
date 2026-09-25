import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, UpdateMedicalRecordSchema } from '@/lib/validations';

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
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id },
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
    });

    if (!medicalRecord) {
      return notFoundResponse('Historia médica');
    }

    if (user.role === 'CLIENT' && medicalRecord.pet.owner.id !== user.userId) {
      return forbiddenResponse();
    }

    return successResponse(medicalRecord);
  } catch (error) {
    return errorResponse('Error al obtener historia médica', 500);
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

    await requireStaff();

    if (user.role === 'RECEPTIONIST') {
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(UpdateMedicalRecordSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { date, title, diagnosis, treatment, publicNotes, privateNotes, vitals } = validation.data;

    const existing = await prisma.medicalRecord.findUnique({
      where: { id },
      include: { vitals: true },
    });

    if (!existing) {
      return notFoundResponse('Historia médica');
    }

    if (user.role === 'VET' && existing.vetId !== user.userId) {
      return forbiddenResponse();
    }

    const previousData: Record<string, unknown> = {
      title: existing.title,
      date: existing.date,
      diagnosis: existing.diagnosis,
      treatment: existing.treatment,
      publicNotes: existing.publicNotes,
      privateNotes: existing.privateNotes,
    };

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (date !== undefined) updateData.date = date;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatment !== undefined) updateData.treatment = treatment;
    if (publicNotes) updateData.publicNotes = publicNotes;
    if (privateNotes !== undefined) updateData.privateNotes = privateNotes;

    const medicalRecord = await prisma.medicalRecord.update({
      where: { id },
      data: updateData,
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
      const vitalsData: Record<string, unknown> = {};
      if (vitals.weight !== undefined) vitalsData.weight = vitals.weight;
      if (vitals.temperature !== undefined) vitalsData.temperature = vitals.temperature;
      if (vitals.heartRate !== undefined) vitalsData.heartRate = vitals.heartRate;
      if (vitals.respiratoryRate !== undefined) vitalsData.respiratoryRate = vitals.respiratoryRate;
      if (vitals.capillaryRefillTime !== undefined) vitalsData.capillaryRefillTime = vitals.capillaryRefillTime;
      if (vitals.dehydrationPercentage !== undefined) vitalsData.dehydrationPercentage = vitals.dehydrationPercentage;
      if (vitals.mucousMembranes !== undefined) vitalsData.mucousMembranes = vitals.mucousMembranes;

      if (existing.vitals) {
        await prisma.vitalSigns.update({
          where: { id: existing.vitals.id },
          data: vitalsData,
        });
      } else {
        await prisma.vitalSigns.create({
          data: {
            ...vitalsData,
            medicalRecordId: medicalRecord.id,
          },
        });
      }
    }

    await createAuditLog({
      user,
      action: 'UPDATE',
      module: 'MedicalRecord',
      entityId: String(medicalRecord.id),
      entityType: 'MedicalRecord',
      ipAddress: await getClientIp(request),
      previousData,
      newData: updateData,
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

    return successResponse(updatedRecord, 'Historia médica actualizada exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al actualizar historia médica', 500);
  }
}

export async function DELETE(
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
    const existing = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Historia médica');
    }

    if (user.role === 'VET' && existing.vetId !== user.userId) {
      return forbiddenResponse();
    }

    await createAuditLog({
      user,
      action: 'DELETE',
      module: 'MedicalRecord',
      entityId: String(existing.id),
      entityType: 'MedicalRecord',
      ipAddress: await getClientIp(request),
      previousData: existing as Record<string, unknown>,
    });

    await prisma.medicalRecord.delete({
      where: { id },
    });

    return successResponse(null, 'Historia médica eliminada exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al eliminar historia médica', 500);
  }
}