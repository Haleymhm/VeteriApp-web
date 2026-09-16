import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helper';
import { generateAuditPDF } from '@/lib/audit-pdf';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const moduleFilter = searchParams.get('module');

    const where: Record<string, unknown> = {
      timestamp: {
        gte: new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`),
        lte: new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`),
      },
    };

    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (moduleFilter) where.module = moduleFilter;

    const logs = await prisma.auditLog.findMany({
      where,
      include: { details: true },
      orderBy: { timestamp: 'desc' },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userFullName: log.userFullName,
      userEmail: log.userEmail,
      action: log.action,
      module: log.module,
      entityId: log.entityId,
      entityType: log.entityType,
      timestamp: log.timestamp.toISOString(),
      ipAddress: log.ipAddress,
      details: log.details,
    }));

    const doc = await generateAuditPDF({
      logs: formattedLogs,
      startDate,
      endDate,
    });

    const pdfBlob = doc.output('blob');

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return new NextResponse('No autorizado', { status: 401 });
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return new NextResponse('Acceso prohibido', { status: 403 });
    }
    return new NextResponse('Error al exportar PDF', { status: 500 });
  }
}