import { db } from '@/lib/db';
import { cards } from '@/lib/schema';
import { generateId, generateSlug, nowUnix } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { invalidateCardQueries } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const count = Math.min(200, Math.max(1, parseInt(String(body.count ?? '10'))));
  const template = body.template || 'premium_black';
  const location = body.location?.trim() || null;
  const businessName = body.businessName?.trim() || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const now = nowUnix();

  const generatedCards: { slug: string; url: string; activateUrl: string; template: string }[] = [];
  const batchSize = 25;

  // Fetch all existing slugs for uniqueness check
  const existingSlugs = new Set(
    (await db.query.cards.findMany({ columns: { slug: true } })).map((c) => c.slug)
  );

  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const batchCount = Math.min(batchSize, count - i);

    for (let j = 0; j < batchCount; j++) {
      let slug = generateSlug(8);
      while (existingSlugs.has(slug)) {
        slug = generateSlug(8);
      }
      existingSlugs.add(slug);

      const id = generateId();
      batch.push({
        id,
        slug,
        businessName,
        location,
        template,
        status: 'unassigned' as const,
        totalScans: 0,
        ownerId: session.userId,
        createdAt: now,
        updatedAt: now,
      });
      generatedCards.push({
        slug,
        url: `${appUrl}/c/${slug}`,
        activateUrl: `${appUrl}/activate/${slug}`,
        template,
      });
    }

    await db.insert(cards).values(batch);
  }

  await invalidateCardQueries();

  return NextResponse.json({
    success: true,
    generated: generatedCards.length,
    cards: generatedCards,
  });
}
