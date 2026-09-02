import { db } from '@/lib/db';
import { deleteCachedCard, invalidateCardQueries } from '@/lib/redis';
import { cards } from '@/lib/schema';
import { nowUnix } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { canManageCard, getAdminSession } from '@/lib/auth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const card = await db.query.cards.findFirst({
    where: eq(cards.id, id),
    columns: { slug: true, status: true, ownerId: true },
  });

  if (!card || !canManageCard(session, card.ownerId)) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  await db
    .update(cards)
    .set({
      pinHash: null,
      status: 'unassigned',
      updatedAt: nowUnix(),
    })
    .where(eq(cards.id, id));

  // Invalidate Redis cache so next tap instantly redirects to activation onboarding
  await Promise.all([deleteCachedCard(card.slug), invalidateCardQueries()]);

  return NextResponse.json({ success: true });
}
