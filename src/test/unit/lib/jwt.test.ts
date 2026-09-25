import { createToken, verifyToken, JWT_SECRET, JWTPayload } from '@/lib/jwt';
import { jwtVerify, SignJWT } from 'jose';

describe('JWT Authentication', () => {
  const mockPayload: JWTPayload = {
    userId: 'a0000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    role: 'CLIENT',
    firstName: 'John',
    lastName: 'Doe',
  };

  describe('createToken', () => {
    it('should create a valid JWT token', async () => {
      const token = await createToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include all payload fields in token', async () => {
      const token = await createToken(mockPayload);
      const { payload } = await jwtVerify(token, JWT_SECRET);
      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.role).toBe(mockPayload.role);
      expect(payload.firstName).toBe(mockPayload.firstName);
      expect(payload.lastName).toBe(mockPayload.lastName);
    });

    it('should create different tokens for different users', async () => {
      const token1 = await createToken(mockPayload);
      const token2 = await createToken({ ...mockPayload, userId: 'a0000000-0000-0000-0000-000000000002' });
      expect(token1).not.toBe(token2);
    });

    it('should create token with correct algorithm', async () => {
      const token = await createToken(mockPayload);
      const { protectedHeader } = await jwtVerify(token, JWT_SECRET);
      expect(protectedHeader.alg).toBe('HS256');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await createToken(mockPayload);
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      if (payload) {
        expect(payload.userId).toBe(mockPayload.userId);
        expect(payload.email).toBe(mockPayload.email);
      }
    });

    it('should return null for invalid token', async () => {
      const payload = await verifyToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for tampered token', async () => {
      const token = await createToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const payload = await verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it('should return null for empty token', async () => {
      const payload = await verifyToken('');
      expect(payload).toBeNull();
    });

    it('should return null for malformed JWT', async () => {
      const payload = await verifyToken('not.a.jwt');
      expect(payload).toBeNull();
    });

    it('should return null for token with wrong secret', async () => {
      const wrongSecret = new TextEncoder().encode('wrong-secret');
      const token = await new SignJWT({ ...mockPayload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(wrongSecret);

      const payload = await verifyToken(token);
      expect(payload).toBeNull();
    });
  });

  describe('token expiration', () => {
    it('should reject expired token', async () => {
      const expiredToken = await new SignJWT({ ...mockPayload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('-1h')
        .sign(JWT_SECRET);

      const payload = await verifyToken(expiredToken);
      expect(payload).toBeNull();
    });

    it('should accept token within expiration', async () => {
      const token = await createToken(mockPayload);
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
    });
  });

  describe('JWTPayload interface', () => {
    it('should accept all valid roles', async () => {
      const roles = ['ADMIN', 'VET', 'RECEPTIONIST', 'CLIENT'] as const;
      for (const role of roles) {
        const token = await createToken({ ...mockPayload, role });
        const payload = await verifyToken(token);
        expect(payload).not.toBeNull();
        if (payload) {
          expect(payload.role).toBe(role);
        }
      }
    });

    it('should handle special characters in names', async () => {
      const token = await createToken({
        ...mockPayload,
        firstName: 'José',
        lastName: 'García',
      });
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      if (payload) {
        expect(payload.firstName).toBe('José');
        expect(payload.lastName).toBe('García');
      }
    });
  });
});