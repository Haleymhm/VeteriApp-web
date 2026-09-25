import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-helper';
import {
  successResponse, errorResponse,
  unauthorizedResponse, forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getClientIp } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!id) return errorResponse('ID inválido', 400);

    const holiday = await prisma.clinicHoliday.findUnique({
      where: { id },
    });
    if (!holiday) return notFoundResponse('Feriado');

    await prisma.clinicHoliday.delete({ where: { id } });

    await createAuditLog({
      user: {
        userId: admin.userId,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
      action: 'DELETE',
      module: 'Configuracion',
      entityId: id,
      entityType: 'ClinicHoliday',
      ipAddress: await getClientIp(request),
      previousData: {
        date: holiday.date,
        label: holiday.label,
      },
    });

    return successResponse(null, 'Feriado eliminado');
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') return unauthorizedResponse();
    if (error instanceof Error && error.message === 'Acceso prohibido') return forbiddenResponse();
    if (error instanceof Error && error.message.includes('Record to delete')) {
      return notFoundResponse('Feriado');
    }
    console.error('Error DELETE holiday:', error);
    return errorResponse('Error al eliminar feriado', 500);
  }
}
