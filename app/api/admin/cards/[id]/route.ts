import { db } from '@/lib/db';
import { setCachedCard, deleteCachedCard, invalidateCardQueries } from '@/lib/redis';
import { cardScans, cards, type NewCard } from '@/lib/schema';
import { hashPin, isValidPin, nowUnix } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { isDirectGoogleReviewUrl } from '@/lib/google-review';
import { canManageCard, getAdminSession } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, id),
  });

  if (!card || !canManageCard(session, card.ownerId)) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json(card);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const card = await db.query.cards.findFirst({
    where: eq(cards.id, id),
    columns: { id: true, slug: true, businessName: true, googleReviewUrl: true, ownerId: true },
  });

  if (!card || !canManageCard(session, card.ownerId)) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const updateData: Partial<NewCard> = {
    updatedAt: nowUnix(),
  };

  if (
    body.googleReviewUrl?.trim() &&
    !isDirectGoogleReviewUrl(body.googleReviewUrl)
  ) {
    return NextResponse.json(
      { error: 'Gunakan link "Minta ulasan" resmi, bukan URL profil Google Maps.' },
      { status: 400 }
    );
  }

  if (body.businessName !== undefined) updateData.businessName = body.businessName?.trim() || null;
  if (body.googleReviewUrl !== undefined) {
    updateData.googleReviewUrl = body.googleReviewUrl?.trim() || null;
    if (body.googleReviewUrl?.trim()) {
      updateData.status = 'active';
    }
  }
  if (body.location !== undefined) updateData.location = body.location?.trim() || null;
  if (body.template !== undefined) updateData.template = body.template || 'premium_black';
  if (body.status !== undefined) updateData.status = body.status;

  if (body.pin) {
    if (!isValidPin(body.pin)) {
      return NextResponse.json({ error: 'PIN harus 6 digit angka.' }, { status: 400 });
    }
    updateData.pinHash = await hashPin(body.pin);
  }

  await db
    .update(cards)
    .set(updateData)
    .where(eq(cards.id, id));

  // Sync Redis Cache
  const finalReviewUrl = updateData.googleReviewUrl ?? card.googleReviewUrl;
  const finalBusinessName = updateData.businessName ?? card.businessName ?? '';
  const finalStatus = updateData.status ?? 'active';

  await Promise.all([
    invalidateCardQueries(),
    finalStatus === 'active' && finalReviewUrl ? setCachedCard(card.slug, {
      google_review_url: finalReviewUrl,
      business_name: finalBusinessName,
      card_id: card.id,
    }) : deleteCachedCard(card.slug),
  ]);

  return NextResponse.json({ success: true, data: updateData });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const card = await db.query.cards.findFirst({
    where: eq(cards.id, id),
    columns: { id: true, slug: true, ownerId: true },
  });

  if (!card || !canManageCard(session, card.ownerId)) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Delete card scans first due to foreign key
  await db.delete(cardScans).where(eq(cardScans.cardId, id));
  await db.delete(cards).where(eq(cards.id, id));

  // Invalidate Redis cache
  await Promise.all([deleteCachedCard(card.slug), invalidateCardQueries()]);

  return NextResponse.json({ success: true, message: 'Card deleted successfully' });
}
