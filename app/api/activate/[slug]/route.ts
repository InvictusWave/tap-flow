import { db } from '@/lib/db';
import { setCachedCard } from '@/lib/redis';
import { isDirectGoogleReviewUrl } from '@/lib/google-review';
import { cards } from '@/lib/schema';
import { hashPin, isValidPin, nowUnix, verifyPin } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessName, location, googleReviewUrl, pin, currentPin } = body as {
    businessName: string;
    location?: string;
    googleReviewUrl: string;
    pin: string;
    currentPin?: string;
  };

  // Validate required fields
  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'Nama bisnis wajib diisi.' }, { status: 400 });
  }
  if (!googleReviewUrl?.trim()) {
    return NextResponse.json({ error: 'Google Review URL wajib diisi.' }, { status: 400 });
  }
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: 'PIN harus 6 digit angka.' }, { status: 400 });
  }

  // Validate URL
  try {
    const parsed = new URL(googleReviewUrl);
    const validHosts = ['g.page', 'maps.app.goo.gl', 'maps.google.com', 'www.google.com', 'google.com', 'search.google.com'];
    const isValid = validHosts.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith('.google.com')
    );
    if (!isValid) {
      return NextResponse.json(
        { error: 'URL harus merupakan link Google Maps / Google Review yang valid.' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Format URL tidak valid.' }, { status: 400 });
  }

  if (!isDirectGoogleReviewUrl(googleReviewUrl)) {
    return NextResponse.json(
      { error: 'Gunakan link "Minta ulasan" resmi, bukan URL profil Google Maps.' },
      { status: 400 }
    );
  }

  // Find card
  const card = await db.query.cards.findFirst({
    where: eq(cards.slug, slug),
  });

  if (!card) {
    return NextResponse.json({ error: 'Kartu tidak ditemukan.' }, { status: 404 });
  }

  const now = nowUnix();
  const cleanBusinessName = businessName.trim();
  const cleanReviewUrl = googleReviewUrl.trim();

  if (card.status === 'unassigned') {
    // New activation
    const pinHash = await hashPin(pin);
    await db
      .update(cards)
      .set({
        businessName: cleanBusinessName,
        location: location?.trim() || null,
        googleReviewUrl: cleanReviewUrl,
        pinHash,
        status: 'active',
        updatedAt: now,
      })
      .where(eq(cards.slug, slug));
  } else {
    // Update existing active card — validate current PIN
    if (!currentPin) {
      return NextResponse.json({ error: 'PIN saat ini wajib diisi untuk verifikasi keamanan.' }, { status: 400 });
    }
    if (!card.pinHash) {
      return NextResponse.json({ error: 'Data PIN kartu tidak ditemukan.' }, { status: 400 });
    }
    const valid = await verifyPin(currentPin, card.pinHash);
    if (!valid) {
      return NextResponse.json({ error: 'PIN salah. Silakan periksa kembali 6 digit PIN Anda.' }, { status: 401 });
    }

    const pinHash = await hashPin(pin);
    await db
      .update(cards)
      .set({
        businessName: cleanBusinessName,
        location: location?.trim() || null,
        googleReviewUrl: cleanReviewUrl,
        pinHash,
        updatedAt: now,
      })
      .where(eq(cards.slug, slug));
  }

  // Proactively warm Redis cache so the first NFC tap is instant (sub-40ms)
  await setCachedCard(slug, {
    google_review_url: cleanReviewUrl,
    business_name: cleanBusinessName,
    card_id: card.id,
  });

  return NextResponse.json({ success: true });
}
