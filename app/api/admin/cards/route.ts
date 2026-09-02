import { db } from '@/lib/db';
import { cards } from '@/lib/schema';
import { count, desc, eq, like, or, sql } from 'drizzle-orm';
import { generateId, generateSlug, hashPin, isValidPin, nowUnix } from '@/lib/utils';
import {
  ADMIN_CACHE_TTL,
  getCachedValue,
  getCardQueryCacheVersion,
  invalidateCardQueries,
  setCachedCard,
  setCachedValue,
} from '@/lib/redis';
import { isDirectGoogleReviewUrl } from '@/lib/google-review';
import { NextRequest, NextResponse } from 'next/server';
import { cardOwnerCondition, getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));
  const status = searchParams.get('status');
  const template = searchParams.get('template');
  const search = searchParams.get('q')?.trim();
  const offset = (page - 1) * pageSize;
  const cacheVersion = await getCardQueryCacheVersion();
  const queryCacheKey = [
    'admin:cards',
    cacheVersion,
    session.role,
    session.userId,
    page,
    pageSize,
    status ?? '',
    template ?? '',
    search ?? '',
  ].join(':');
  const cached = await getCachedValue<Record<string, unknown>>(queryCacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-TapFlow-Cache': 'HIT-REDIS' },
    });
  }

  const whereConditions = [];
  const ownerCondition = cardOwnerCondition(session);
  if (ownerCondition) whereConditions.push(ownerCondition);

  if (status && status !== 'all') {
    whereConditions.push(eq(cards.status, status as 'active' | 'unassigned'));
  }

  if (template && template !== 'all') {
    whereConditions.push(eq(cards.template, template));
  }

  if (search) {
    whereConditions.push(
      or(
        like(cards.slug, `%${search}%`),
        like(cards.businessName, `%${search}%`),
        like(cards.location, `%${search}%`)
      )
    );
  }

  const whereClause =
    whereConditions.length > 0
      ? sql`${sql.join(whereConditions, sql` AND `)}`
      : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.cards.findMany({
      where: whereClause,
      orderBy: [desc(cards.createdAt)],
      limit: pageSize,
      offset,
      columns: {
        id: true,
        slug: true,
        businessName: true,
        googleReviewUrl: true,
        location: true,
        template: true,
        status: true,
        totalScans: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db
      .select({ total: count() })
      .from(cards)
      .where(whereClause ?? sql`1=1`),
  ]);

  const response = {
    data: rows,
    pagination: {
      page,
      pageSize,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / pageSize),
    },
  };
  await setCachedValue(queryCacheKey, response, ADMIN_CACHE_TTL);

  return NextResponse.json(response, {
    headers: { 'X-TapFlow-Cache': 'MISS-WARMED' },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { slug: rawSlug, businessName, googleReviewUrl, pin, location, template } = body;
  const slug = (rawSlug || generateSlug(8)).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  if (slug.length < 3) {
    return NextResponse.json({ error: 'Slug minimal 3 karakter.' }, { status: 400 });
  }

  if (googleReviewUrl?.trim() && !isDirectGoogleReviewUrl(googleReviewUrl)) {
    return NextResponse.json(
      { error: 'Gunakan link "Minta ulasan" resmi, bukan URL profil Google Maps.' },
      { status: 400 }
    );
  }

  // Check unique slug
  const existing = await db.query.cards.findFirst({
    where: eq(cards.slug, slug),
  });

  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" sudah digunakan.` }, { status: 409 });
  }

  let pinHash = null;
  if (pin) {
    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN harus berupa 6 digit angka.' }, { status: 400 });
    }
    pinHash = await hashPin(pin);
  }

  const now = nowUnix();
  const id = generateId();
  const status = googleReviewUrl?.trim() ? 'active' : 'unassigned';

  const newCard = {
    id,
    slug,
    businessName: businessName?.trim() || null,
    googleReviewUrl: googleReviewUrl?.trim() || null,
    pinHash,
    location: location?.trim() || null,
    template: template || 'premium_black',
    status: status as 'active' | 'unassigned',
    totalScans: 0,
    ownerId: session.userId,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(cards).values(newCard);

  await Promise.all([
    invalidateCardQueries(),
    status === 'active' && newCard.googleReviewUrl ? setCachedCard(slug, {
      google_review_url: newCard.googleReviewUrl,
      business_name: newCard.businessName ?? '',
      card_id: id,
    }) : Promise.resolve(),
  ]);

  return NextResponse.json({
    success: true,
    data: newCard,
  });
}
