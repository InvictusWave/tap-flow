import type { AdminRole } from '@/lib/schema';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export interface AdminSessionToken {
  userId: string;
  role: AdminRole;
  exp: number;
}

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('An admin session secret is required');
  return secret;
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(payload: AdminSessionToken) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(data));
  return `${data}.${Buffer.from(signature).toString('base64url')}`;
}

export async function verifySessionToken(token?: string): Promise<AdminSessionToken | null> {
  try {
    if (!token) return null;
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      Buffer.from(signature, 'base64url'),
      encoder.encode(data)
    );
    if (!valid) return null;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as AdminSessionToken;
    if (!payload.userId || !['super_admin', 'admin'].includes(payload.role) || payload.exp <= Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
