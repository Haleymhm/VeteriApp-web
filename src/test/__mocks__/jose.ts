const tokens = new Map<string, { payload: Record<string, unknown>; expired: boolean }>();
let tokenCounter = 0;

export const jwtVerify = jest.fn().mockImplementation((token: string) => {
  if (token === 'invalid-token' || token === '' || token === 'not.a.jwt' || token.includes('xxxxx')) {
    throw new Error('Invalid token');
  }

  const entry = tokens.get(token);
  if (entry && entry.expired) {
    throw new Error('Token expired');
  }
  if (token.startsWith('wrong-secret') || token === 'wrong-secret-token') {
    throw new Error('JWT verification failed');
  }
  if (entry) {
    return Promise.resolve({
      payload: entry.payload,
      protectedHeader: { alg: 'HS256' },
    });
  }

  return Promise.resolve({
    payload: {
      userId: 'a0000000-0000-4000-a000-000000000001',
      email: 'test@example.com',
      role: 'CLIENT',
      firstName: 'John',
      lastName: 'Doe',
    },
    protectedHeader: { alg: 'HS256' },
  });
});

interface SignJWTInstance {
  setProtectedHeader: (header: { alg: string }) => SignJWTInstance;
  setIssuedAt: () => SignJWTInstance;
  setExpirationTime: (time: string) => SignJWTInstance;
  sign: (secret: Uint8Array) => Promise<string>;
}

export const SignJWT = jest.fn().mockImplementation((payload: Record<string, unknown>) => {
  const state: {
    payload: Record<string, unknown>;
    expirationTime: string | null;
    secret: Uint8Array | null;
  } = {
    payload,
    expirationTime: null,
    secret: null,
  };

  const instance: SignJWTInstance = {
    setProtectedHeader() {
      return instance;
    },
    setIssuedAt() {
      return instance;
    },
    setExpirationTime(time: string) {
      state.expirationTime = time;
      return instance;
    },
    async sign(secret: Uint8Array) {
      state.secret = secret;
      tokenCounter++;
      const prefix =
        state.expirationTime && state.expirationTime.startsWith('-')
          ? 'expiredtoken'
          : secret && new TextDecoder().decode(secret).includes('wrong')
            ? 'wrong-secret'
            : 'mocktoken';
      const token = `${prefix}${tokenCounter}.payload.signature`;
      const isExpired =
        !!state.expirationTime &&
        (state.expirationTime.startsWith('-') ||
          state.expirationTime === '0' ||
          state.expirationTime === 'expired');
      tokens.set(token, { payload: state.payload, expired: isExpired });
      return token;
    },
  };
  return instance;
});
