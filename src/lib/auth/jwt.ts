import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getEnv } from '@/lib/env';

const TOKEN_TTL = '7d';

export interface AuthTokenClaims {
  sub: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
}

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
}

function getSecret(): Uint8Array {
  const secret = getEnv('JWT_SECRET');
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenClaims): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ['HS256'],
  });

  if (!payload.sub || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
    throw new Error('Invalid token payload');
  }

  return payload as AuthTokenPayload;
}
