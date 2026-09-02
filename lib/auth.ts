import 'server-only';

import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { adminUsers, cards, type AdminRole } from '@/lib/schema';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import { isAdminExpired } from '@/lib/admin-access';

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db.query.adminUsers.findFirst({
    where: and(eq(adminUsers.id, payload.userId), eq(adminUsers.active, true)),
    columns: { id: true, name: true, email: true, role: true, expiresAt: true },
  });

  return user && !isAdminExpired(user.expiresAt)
    ? { userId: user.id, name: user.name, email: user.email, role: user.role }
    : null;
}

export function cardOwnerCondition(session: AdminSession) {
  return session.role === 'super_admin' ? undefined : eq(cards.ownerId, session.userId);
}

export function canManageCard(session: AdminSession, ownerId: string | null) {
  return session.role === 'super_admin' || ownerId === session.userId;
}
