import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/schema';
import { getAdminSession } from '@/lib/auth';
import { generateId, nowUnix } from '@/lib/utils';
import { ADMIN_SESSION_COOKIE, createSessionToken } from '@/lib/session';
import { isAdminExpired } from '@/lib/admin-access';

export async function GET() {
  const session = await getAdminSession();
  return session
    ? NextResponse.json({ user: session })
    : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const { email: rawEmail, password } = await request.json();
  const email = String(rawEmail || '').trim().toLowerCase();

  if (!email || !password) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let user = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
  let passwordVerified = false;

  if (!user) {
    const bootstrapEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@tapflow.local').toLowerCase();
    const bootstrapPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (email !== bootstrapEmail || !bootstrapPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(bootstrapPassword, 10);
    if (!(await bcrypt.compare(password, passwordHash))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    passwordVerified = true;

    const id = generateId();
    await db.insert(adminUsers).values({
      id,
      name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      email,
      passwordHash,
      role: 'super_admin',
      active: true,
      createdAt: nowUnix(),
    });
    user = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  }

  if (!user?.active || (!passwordVerified && !(await bcrypt.compare(password, user.passwordHash)))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isAdminExpired(user.expiresAt)) {
    return NextResponse.json(
      { error: 'Masa aktif akun Anda telah berakhir. Silakan hubungi super admin untuk perpanjangan.' },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });
  const sessionExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  response.cookies.set(ADMIN_SESSION_COOKIE, await createSessionToken({
    userId: user.id,
    role: user.role,
    exp: Math.min(sessionExpiresAt, user.expiresAt ?? sessionExpiresAt),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
