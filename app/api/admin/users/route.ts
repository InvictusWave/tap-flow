import bcrypt from 'bcryptjs';
import { asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/schema';
import { generateId, nowUnix } from '@/lib/utils';
import { isAdminExpired } from '@/lib/admin-access';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await db.query.adminUsers.findMany({
    orderBy: [asc(adminUsers.createdAt)],
    columns: { id: true, name: true, email: true, role: true, active: true, expiresAt: true, createdAt: true },
  });
  return NextResponse.json({ users: users.map((user) => ({ ...user, expired: isAdminExpired(user.expiresAt) })) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name: rawName, email: rawEmail, password, validityDays: rawValidityDays } = await request.json();
  const name = String(rawName || '').trim();
  const email = String(rawEmail || '').trim().toLowerCase();
  const validityDays = rawValidityDays === '' || rawValidityDays == null ? null : Number(rawValidityDays);

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Nama, email valid, dan password minimal 8 karakter wajib diisi.' },
      { status: 400 }
    );
  }

  if (validityDays !== null && (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 3650)) {
    return NextResponse.json({ error: 'Masa aktif harus 1–3650 hari.' }, { status: 400 });
  }

  try {
    const now = nowUnix();
    await db.insert(adminUsers).values({
      id: generateId(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
      active: true,
      expiresAt: validityDays === null ? null : now + validityDays * 86400,
      createdAt: now,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Email admin sudah digunakan.' }, { status: 409 });
  }
}
