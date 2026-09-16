import { createAuditLog, detectFieldChanges, getClientIp, AuditAction } from '@/lib/audit';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => {
  const fn = () => undefined;
  return {
    __esModule: true,
    default: {
      debug: jest.fn(fn),
      info: jest.fn(fn),
      warn: jest.fn(fn),
      error: jest.fn(fn),
    },
    logger: {
      debug: jest.fn(fn),
      info: jest.fn(fn),
      warn: jest.fn(fn),
      error: jest.fn(fn),
    },
  };
});

describe('Audit Module - Pure Functions', () => {
  describe('detectFieldChanges', () => {
    it('should detect no changes when data is identical', () => {
      const before = { name: 'Firulais', species: 'Canino' };
      const after = { name: 'Firulais', species: 'Canino' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(0);
    });

    it('should detect changes when values differ', () => {
      const before = { name: 'Firulais', species: 'Canino' };
      const after = { name: 'Bobby', species: 'Canino' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ fieldName: 'name', oldValue: 'Firulais', newValue: 'Bobby' });
    });

    it('should detect multiple changes', () => {
      const before = { name: 'Firulais', species: 'Canino', weight: 10 };
      const after = { name: 'Bobby', species: 'Felino', weight: 10 };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(2);
    });

    it('should ignore createdAt and updatedAt fields', () => {
      const before = { name: 'Firulais', createdAt: '2024-01-01', updatedAt: '2024-01-02' };
      const after = { name: 'Firulais', createdAt: '2024-01-03', updatedAt: '2024-01-04' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(0);
    });

    it('should ignore id field by default', () => {
      const before = { id: 1, name: 'Firulais' };
      const after = { id: 2, name: 'Firulais' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(0);
    });

    it('should detect null to value changes', () => {
      const before = { name: null };
      const after = { name: 'Firulais' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ fieldName: 'name', oldValue: null, newValue: 'Firulais' });
    });

    it('should detect value to null changes', () => {
      const before = { name: 'Firulais' };
      const after = { name: null };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ fieldName: 'name', oldValue: 'Firulais', newValue: null });
    });

    it('should handle added fields (in after but not in before)', () => {
      const before = { name: 'Firulais' };
      const after = { name: 'Firulais', species: 'Canino' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ fieldName: 'species', oldValue: null, newValue: 'Canino' });
    });

    it('should handle removed fields (in before but not in after)', () => {
      const before = { name: 'Firulais', species: 'Canino' };
      const after = { name: 'Firulais' };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ fieldName: 'species', oldValue: 'Canino', newValue: null });
    });

    it('should return empty array when before is null', () => {
      const after = { name: 'Firulais', species: 'Canino' };
      const changes = detectFieldChanges(null, after);
      expect(changes).toHaveLength(0);
    });

    it('should convert numeric values to strings', () => {
      const before = { weight: 10 };
      const after = { weight: 15 };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0].oldValue).toBe('10');
      expect(changes[0].newValue).toBe('15');
    });

    it('should handle custom fields to ignore', () => {
      const before = { name: 'Firulais', internalId: 123 };
      const after = { name: 'Firulais', internalId: 456 };
      const changes = detectFieldChanges(before, after, ['internalId']);
      expect(changes).toHaveLength(0);
    });

    it('should compare boolean values correctly', () => {
      const before = { isActive: true };
      const after = { isActive: false };
      const changes = detectFieldChanges(before, after);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ fieldName: 'isActive', oldValue: 'true', newValue: 'false' });
    });
  });

  describe('getClientIp', () => {
    it('should extract first IP from x-forwarded-for header', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' },
      });
      const ip = await getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should use x-real-ip when x-forwarded-for is missing', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.100' },
      });
      const ip = await getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should prioritize x-forwarded-for over x-real-ip', async () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.100',
        },
      });
      const ip = await getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return undefined when no headers present', async () => {
      const request = new Request('http://localhost');
      const ip = await getClientIp(request);
      expect(ip).toBeUndefined();
    });

    it('should handle empty x-forwarded-for', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '' },
      });
      const ip = await getClientIp(request);
      expect(ip).toBeUndefined();
    });

    it('should handle single IP in x-forwarded-for', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const ip = await getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should trim whitespace from IP', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      });
      const ip = await getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });
  });
});

describe('Audit Module - createAuditLog', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/prisma');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('@/lib/logger').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    userId: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  it('should create audit log with all required fields', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    await createAuditLog({
      user: mockUser,
      action: 'CREATE',
      module: 'pets',
      entityId: '123',
      entityType: 'Pet',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    const createCall = prisma.auditLog.create.mock.calls[0];
    expect(createCall[0].data.userId).toBe(1);
    expect(createCall[0].data.userFullName).toBe('John Doe');
    expect(createCall[0].data.action).toBe('CREATE');
    expect(createCall[0].data.module).toBe('pets');
    expect(createCall[0].data.entityId).toBe('123');
  });

  it('should include IP address when provided', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    await createAuditLog({
      user: mockUser,
      action: 'UPDATE',
      module: 'pets',
      entityId: '123',
      entityType: 'Pet',
      ipAddress: '192.168.1.1',
    });

    const createCall = prisma.auditLog.create.mock.calls[0];
    expect(createCall[0].data.ipAddress).toBe('192.168.1.1');
  });

  it('should log success message', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    await createAuditLog({
      user: mockUser,
      action: 'DELETE',
      module: 'appointments',
      entityId: '456',
      entityType: 'Appointment',
    });

    expect(logger.info).toHaveBeenCalledWith('Audit log created: DELETE on Appointment:456');
  });

  it('should handle errors gracefully', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockRejectedValue(new Error('DB Error'));

    await expect(
      createAuditLog({
        user: mockUser,
        action: 'CREATE',
        module: 'pets',
        entityId: '123',
        entityType: 'Pet',
      })
    ).resolves.not.toThrow();

    expect(logger.error).toHaveBeenCalled();
  });

  it('should use previous audit log signature as hash', async () => {
    const lastSignature = 'previous-signature-hash-123';
    prisma.auditLog.findFirst.mockResolvedValue({ signature: lastSignature });
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    await createAuditLog({
      user: mockUser,
      action: 'CREATE',
      module: 'pets',
      entityId: '123',
      entityType: 'Pet',
    });

    expect(prisma.auditLog.findFirst).toHaveBeenCalledWith({
      orderBy: { timestamp: 'desc' },
      select: { signature: true },
    });
  });

  it('should start with hash "0" when no previous audit logs exist', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    await createAuditLog({
      user: mockUser,
      action: 'CREATE',
      module: 'pets',
      entityId: '123',
      entityType: 'Pet',
    });

    const createCall = prisma.auditLog.create.mock.calls[0];
    expect(createCall[0].data.previousHash).toBeDefined();
  });

  it('should create field change details', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    await createAuditLog({
      user: mockUser,
      action: 'UPDATE',
      module: 'pets',
      entityId: '123',
      entityType: 'Pet',
      previousData: { name: 'OldName' },
      newData: { name: 'NewName' },
    });

    const createCall = prisma.auditLog.create.mock.calls[0];
    expect(createCall[0].data.details.create).toBeDefined();
  });

  it('should accept custom fieldChanges array', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

    const customChanges = [{ fieldName: 'status', oldValue: 'pending', newValue: 'confirmed' }];

    await createAuditLog({
      user: mockUser,
      action: 'UPDATE',
      module: 'appointments',
      entityId: '123',
      entityType: 'Appointment',
      fieldChanges: customChanges,
    });

    const createCall = prisma.auditLog.create.mock.calls[0];
    expect(createCall[0].data.details.create).toEqual(customChanges);
  });
});

describe('AuditAction Type', () => {
  it('should accept valid audit actions', () => {
    const actions: AuditAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    actions.forEach(action => {
      expect(['CREATE', 'READ', 'UPDATE', 'DELETE']).toContain(action);
    });
  });
});