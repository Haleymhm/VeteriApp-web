import crypto from 'crypto';

const AUDIT_SECRET_KEY = process.env.AUDIT_SECRET_KEY || 'default-dev-key-change-in-production';

export interface AuditLogData {
  userId: string;
  userFullName: string;
  userEmail: string;
  action: string;
  module: string;
  entityId: string;
  entityType: string;
  timestamp: Date;
  ipAddress?: string | null;
  fieldChanges?: Array<{ fieldName: string; oldValue: string | null; newValue: string | null }>;
}

export function calculateHash(data: AuditLogData, previousHash: string): string {
  const content = JSON.stringify({
    userId: data.userId,
    userFullName: data.userFullName,
    userEmail: data.userEmail,
    action: data.action,
    module: data.module,
    entityId: data.entityId,
    entityType: data.entityType,
    timestamp: data.timestamp.toISOString(),
    ipAddress: data.ipAddress,
    fieldChanges: data.fieldChanges,
    previousHash,
  });

  return crypto.createHash('sha256').update(content).digest('hex');
}

export function generateSignature(data: AuditLogData & { previousHash: string }): string {
  const content = JSON.stringify({
    id: data.entityId,
    userId: data.userId,
    action: data.action,
    module: data.module,
    entityType: data.entityType,
    timestamp: data.timestamp.toISOString(),
    previousHash: data.previousHash,
  });

  return crypto.createHmac('sha256', AUDIT_SECRET_KEY).update(content).digest('hex');
}

export function verifySignature(data: AuditLogData & { previousHash: string; signature: string }): boolean {
  const expectedSignature = generateSignature(data);
  return crypto.timingSafeEqual(Buffer.from(data.signature), Buffer.from(expectedSignature));
}

export function getLastAuditLogHash(): Promise<string> {
  return Promise.resolve('0');
}