import { headers as nextHeaders } from 'next/headers';
import { prisma } from './prisma';
import { calculateHash, generateSignature, AuditLogData } from '../services/audit-signature';
import logger from './logger';

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface FieldChange {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

interface UserInfo {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function detectFieldChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  fieldsToIgnore: string[] = ['createdAt', 'updatedAt', 'id']
): FieldChange[] {
  const changes: FieldChange[] = [];

  if (!before) {
    return changes;
  }

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]) as Set<string>;

  for (const key of allKeys) {
    if (fieldsToIgnore.includes(key)) continue;

    const oldVal = before[key];
    const newVal = after[key];

    const oldStr = oldVal == null ? null : String(oldVal);
    const newStr = newVal == null ? null : String(newVal);

    if (oldStr !== newStr) {
      changes.push({
        fieldName: key,
        oldValue: oldStr,
        newValue: newStr,
      });
    }
  }

  return changes;
}

async function getLastHash(): Promise<string> {
  try {
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { signature: true },
    });
    return lastLog?.signature || '0';
  } catch {
    return '0';
  }
}

export async function createAuditLog(params: {
  user: UserInfo;
  action: AuditAction;
  module: string;
  entityId: string;
  entityType: string;
  ipAddress?: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown>;
  fieldChanges?: FieldChange[];
}): Promise<void> {
  try {
    const previousHash = await getLastHash();
    const fieldChanges = params.fieldChanges ||
      detectFieldChanges(params.previousData || null, params.newData || {});

    const timestamp = new Date();

    const logData: AuditLogData = {
      userId: params.user.userId,
      userFullName: `${params.user.firstName} ${params.user.lastName}`,
      userEmail: params.user.email,
      action: params.action,
      module: params.module,
      entityId: params.entityId,
      entityType: params.entityType,
      timestamp,
      ipAddress: params.ipAddress,
      fieldChanges,
    };

    const hash = calculateHash(logData, previousHash);
    const signature = generateSignature({ ...logData, previousHash: hash });

    await prisma.auditLog.create({
      data: {
        userId: params.user.userId,
        userFullName: `${params.user.firstName} ${params.user.lastName}`,
        userEmail: params.user.email,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        entityType: params.entityType,
        timestamp,
        ipAddress: params.ipAddress,
        previousHash: hash,
        signature,
        details: {
          create: fieldChanges.map((change) => ({
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
          })),
        },
      },
    });

    logger.info(`Audit log created: ${params.action} on ${params.entityType}:${params.entityId}`);
  } catch (error) {
    logger.error('Failed to create audit log', error);
  }
}

export async function getClientIp(request: Request): Promise<string | undefined> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return undefined;
}

export async function verifyAuditLogIntegrity(logId: string): Promise<boolean> {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: { details: true },
    });

    if (!log) return false;

    const previousLog = await prisma.auditLog.findFirst({
      where: { timestamp: { lt: log.timestamp } },
      orderBy: { timestamp: 'desc' },
      select: { signature: true },
    });

    const previousHash = previousLog?.signature || '0';

    const logData: AuditLogData = {
      userId: log.userId,
      userFullName: log.userFullName,
      userEmail: log.userEmail,
      action: log.action,
      module: log.module,
      entityId: log.entityId,
      entityType: log.entityType,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      fieldChanges: log.details.map((d) => ({
        fieldName: d.fieldName,
        oldValue: d.oldValue,
        newValue: d.newValue,
      })),
    };

    const expectedHash = calculateHash(logData, previousHash);
    return log.previousHash === expectedHash;
  } catch (error) {
    logger.error('Failed to verify audit log integrity', error);
    return false;
  }
}