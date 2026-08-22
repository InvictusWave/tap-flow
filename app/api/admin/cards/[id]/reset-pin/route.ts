import { db } from '@/lib/db';
import { deleteCachedCard } from '@/lib/redis';
import { cards } from '@/lib/schema';
import { nowUnix } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const card = await db.query.cards.findFirst({
    where: eq(cards.id, id),
    columns: { slug: true, status: true },
  });

  if (!card) {
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
  await deleteCachedCard(card.slug);

  return NextResponse.json({ success: true });
}
