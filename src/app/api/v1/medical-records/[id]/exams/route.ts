import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireStaff } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { createAuditLog, getClientIp } from '@/lib/audit';
import { validateBody, CreateExamAttachmentSchema } from '@/lib/validations';

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
      select: { id: true, petId: true, pet: { select: { ownerId: true } } },
    });

    if (!medicalRecord) {
      return notFoundResponse('Historia médica');
    }

    if (user.role === 'CLIENT' && medicalRecord.pet.ownerId !== user.userId) {
      return forbiddenResponse();
    }

    const exams = await prisma.examAttachment.findMany({
      where: { medicalRecordId: id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(exams);
  } catch (error) {
    return errorResponse('Error al obtener exámenes', 500);
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
    const validation = validateBody(CreateExamAttachmentSchema, body);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { fileName, fileUrl, fileType, description } = validation.data;

    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!medicalRecord) {
      return notFoundResponse('Historia médica');
    }

    if (user.role === 'VET' && medicalRecord.vetId !== user.userId) {
      return forbiddenResponse();
    }

    const createData = {
      fileName,
      fileUrl,
      fileType,
      description: description || null,
      medicalRecordId: id,
    };

    const exam = await prisma.examAttachment.create({
      data: createData,
    });

    await createAuditLog({
      user,
      action: 'CREATE',
      module: 'ExamAttachment',
      entityId: String(exam.id),
      entityType: 'ExamAttachment',
      ipAddress: await getClientIp(request),
      newData: createData as Record<string, unknown>,
    });

    return successResponse(exam, 'Examen adjuntado exitosamente', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al adjuntar examen', 500);
  }
}