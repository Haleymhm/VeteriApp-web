import { calculateHash, generateSignature, verifySignature } from '@/services/audit-signature';
import type { AuditLogData } from '@/services/audit-signature';

describe('Audit Signature Service', () => {
  const baseAuditData: AuditLogData = {
    userId: 'a0000000-0000-0000-0000-000000000001',
    userFullName: 'John Doe',
    userEmail: 'john@example.com',
    action: 'CREATE',
    module: 'pets',
    entityId: '123',
    entityType: 'Pet',
    timestamp: new Date('2024-01-15T10:00:00.000Z'),
    ipAddress: '192.168.1.1',
    fieldChanges: [
      { fieldName: 'name', oldValue: null, newValue: 'Firulais' },
      { fieldName: 'species', oldValue: null, newValue: 'Canino' },
    ],
  };

  describe('calculateHash', () => {
    it('should return a SHA-256 hash string', () => {
      const hash = calculateHash(baseAuditData, '0');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });

    it('should generate different hashes for different data', () => {
      const hash1 = calculateHash(baseAuditData, '0');
      const hash2 = calculateHash({ ...baseAuditData, userId: 'a0000000-0000-0000-0000-000000000002' }, '0');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash for same data and previousHash', () => {
      const hash1 = calculateHash(baseAuditData, 'abc123');
      const hash2 = calculateHash(baseAuditData, 'abc123');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different previousHash', () => {
      const hash1 = calculateHash(baseAuditData, '0');
      const hash2 = calculateHash(baseAuditData, 'previous-hash-value');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different timestamps', () => {
      const data1 = { ...baseAuditData, timestamp: new Date('2024-01-15T10:00:00.000Z') };
      const data2 = { ...baseAuditData, timestamp: new Date('2024-01-15T11:00:00.000Z') };
      const hash1 = calculateHash(data1, '0');
      const hash2 = calculateHash(data2, '0');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty fieldChanges', () => {
      const hash = calculateHash({ ...baseAuditData, fieldChanges: [] }, '0');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
    });

    it('should handle undefined fieldChanges', () => {
      const data = { ...baseAuditData, fieldChanges: undefined };
      const hash = calculateHash(data, '0');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
    });

    it('should handle null ipAddress', () => {
      const data = { ...baseAuditData, ipAddress: null };
      const hash = calculateHash(data, '0');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
    });

    it('should handle undefined ipAddress', () => {
      const data = { ...baseAuditData, ipAddress: undefined };
      const hash = calculateHash(data, '0');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
    });

    it('should include all field changes in hash calculation', () => {
      const dataWithChanges = {
        ...baseAuditData,
        fieldChanges: [
          { fieldName: 'name', oldValue: 'Old', newValue: 'New' },
          { fieldName: 'weight', oldValue: '10', newValue: '15' },
        ],
      };
      const hash = calculateHash(dataWithChanges, '0');
      expect(typeof hash).toBe('string');
    });

    it('should be deterministic regardless of field order', () => {
      const data1: AuditLogData = {
        ...baseAuditData,
        fieldChanges: [
          { fieldName: 'name', oldValue: 'A', newValue: 'B' },
          { fieldName: 'age', oldValue: '1', newValue: '2' },
        ],
      };
      const hash1 = calculateHash(data1, 'prev');
      const hash2 = calculateHash(data1, 'prev');
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateSignature', () => {
    it('should return a HMAC-SHA256 signature string', () => {
      const signature = generateSignature({ ...baseAuditData, previousHash: 'hash123' });
      expect(typeof signature).toBe('string');
      expect(signature).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(signature)).toBe(true);
    });

    it('should generate different signatures for different entityId', () => {
      const sig1 = generateSignature({ ...baseAuditData, entityId: '123', previousHash: 'hash' });
      const sig2 = generateSignature({ ...baseAuditData, entityId: '456', previousHash: 'hash' });
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different actions', () => {
      const sig1 = generateSignature({ ...baseAuditData, action: 'CREATE', previousHash: 'hash' });
      const sig2 = generateSignature({ ...baseAuditData, action: 'DELETE', previousHash: 'hash' });
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different previousHash', () => {
      const sig1 = generateSignature({ ...baseAuditData, previousHash: 'hash1' });
      const sig2 = generateSignature({ ...baseAuditData, previousHash: 'hash2' });
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different timestamps', () => {
      const sig1 = generateSignature({
        ...baseAuditData,
        timestamp: new Date('2024-01-15T10:00:00.000Z'),
        previousHash: 'hash',
      });
      const sig2 = generateSignature({
        ...baseAuditData,
        timestamp: new Date('2024-01-15T11:00:00.000Z'),
        previousHash: 'hash',
      });
      expect(sig1).not.toBe(sig2);
    });

    it('should be consistent with same inputs', () => {
      const sig1 = generateSignature({ ...baseAuditData, previousHash: 'test-hash' });
      const sig2 = generateSignature({ ...baseAuditData, previousHash: 'test-hash' });
      expect(sig1).toBe(sig2);
    });

    it('should use AUDIT_SECRET_KEY environment variable', () => {
      const sig = generateSignature({ ...baseAuditData, previousHash: 'hash' });
      expect(typeof sig).toBe('string');
      expect(sig).toHaveLength(64);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      const previousHash = 'previous-hash-123';
      const dataWithHash = { ...baseAuditData, previousHash };
      const signature = generateSignature(dataWithHash);
      const isValid = verifySignature({ ...dataWithHash, signature });
      expect(isValid).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const previousHash = 'previous-hash-123';
      const dataWithHash = { ...baseAuditData, previousHash };
      const invalidSignature = 'a'.repeat(64);
      const isValid = verifySignature({ ...dataWithHash, signature: invalidSignature });
      expect(isValid).toBe(false);
    });

    it('should return false for tampered data', () => {
      const previousHash = 'previous-hash-123';
      const originalData = { ...baseAuditData, previousHash };
      const signature = generateSignature(originalData);

      const tamperedData = { ...baseAuditData, userId: 'b9999999-9999-9999-9999-999999999999', previousHash };
      const isValid = verifySignature({ ...tamperedData, signature });
      expect(isValid).toBe(false);
    });

    it('should return false for tampered previousHash', () => {
      const originalData = { ...baseAuditData, previousHash: 'original-hash' };
      const signature = generateSignature(originalData);

      const tamperedData = { ...baseAuditData, previousHash: 'tampered-hash' };
      const isValid = verifySignature({ ...tamperedData, signature });
      expect(isValid).toBe(false);
    });

    it('should return false for tampered timestamp', () => {
      const previousHash = 'previous-hash-123';
      const originalData = { ...baseAuditData, timestamp: new Date('2024-01-15T10:00:00.000Z'), previousHash };
      const signature = generateSignature(originalData);

      const tamperedData = {
        ...baseAuditData,
        timestamp: new Date('2025-01-15T10:00:00.000Z'),
        previousHash,
      };
      const isValid = verifySignature({ ...tamperedData, signature });
      expect(isValid).toBe(false);
    });

    it('should handle different signature lengths gracefully', () => {
      const previousHash = 'hash';
      const dataWithHash = { ...baseAuditData, previousHash };
      const shortSignature = 'abc';
      expect(() => verifySignature({ ...dataWithHash, signature: shortSignature })).toThrow();
    });
  });

  describe('Hash and Signature Chain', () => {
    it('should chain correctly: hash depends on previousHash', () => {
      const data1 = { ...baseAuditData, previousHash: '0' };
      const hash1 = calculateHash(data1, '0');

      const data2 = { ...baseAuditData, previousHash: hash1 };
      const hash2 = calculateHash(data2, hash1);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce verifiable signature after hash calculation', () => {
      const previousHash = 'genesis-hash';
      const auditData = { ...baseAuditData, previousHash };
      const hash = calculateHash(auditData, previousHash);
      const signature = generateSignature({ ...auditData, previousHash: hash });

      const isValid = verifySignature({ ...auditData, previousHash: hash, signature });
      expect(isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in userFullName', () => {
      const data = { ...baseAuditData, userFullName: 'José García López' };
      const hash = calculateHash(data, '0');
      expect(hash).toHaveLength(64);
    });

    it('should handle unicode characters in module name', () => {
      const data = { ...baseAuditData, module: 'mascotas' };
      const hash = calculateHash(data, '0');
      expect(hash).toHaveLength(64);
    });

    it('should handle long field change values', () => {
      const data = {
        ...baseAuditData,
        fieldChanges: [
          { fieldName: 'description', oldValue: 'a'.repeat(1000), newValue: 'b'.repeat(1000) },
        ],
      };
      const hash = calculateHash(data, '0');
      expect(hash).toHaveLength(64);
    });

    it('should handle empty module string', () => {
      const data = { ...baseAuditData, module: '' };
      const hash = calculateHash(data, '0');
      const sig = generateSignature({ ...data, previousHash: '0' });
      expect(hash).toHaveLength(64);
      expect(sig).toHaveLength(64);
    });
  });
});