import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helper';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const moduleFilter = searchParams.get('module');
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (moduleFilter) where.module = moduleFilter;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, unknown>).gte = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        (where.timestamp as Record<string, unknown>).lte = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          details: true,
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userFullName: log.userFullName,
      userEmail: log.userEmail,
      action: log.action,
      module: log.module,
      entityId: log.entityId,
      entityType: log.entityType,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      details: log.details,
    }));

    return successResponse({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    if (error instanceof Error && error.message === 'No autorizado') {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === 'Acceso prohibido') {
      return forbiddenResponse();
    }
    return errorResponse('Error al obtener logs de auditoría: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
  }
}