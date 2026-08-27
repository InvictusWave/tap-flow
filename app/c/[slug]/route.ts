import { after, NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cards, cardScans } from '@/lib/schema';
import { getCachedCard, setCachedCard, CachedCard } from '@/lib/redis';
import { eq, sql } from 'drizzle-orm';
import {
  isDirectGoogleReviewUrl,
  resolveDirectGoogleReviewUrl,
} from '@/lib/google-review';

export const runtime = 'nodejs';

// Asynchronous background scan recorder (does not block HTTP redirect response)
async function recordScan(cardId: string, userAgent: string) {
  const now = Math.floor(Date.now() / 1000);
  await Promise.all([
    db
      .update(cards)
      .set({
        totalScans: sql`${cards.totalScans} + 1`,
        updatedAt: now,
      })
      .where(eq(cards.id, cardId)),
    db.insert(cardScans).values({
      id: crypto.randomUUID(),
      cardId,
      scannedAt: now,
      userAgent: userAgent.slice(0, 500),
    }),
  ]).catch((err) => {
    console.error('Non-critical: background scan recording failed:', err);
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userAgent = request.headers.get('user-agent') ?? '';
  const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || '';

  // Simple Rate-Limiting / Anti-Spam: 
  // We use a cookie to prevent double counting analytics if tapped within 1 hour.
  const cookieName = `tf_scan_${slug}`;
  const shouldRecordAnalytics = !request.cookies.has(cookieName);

  // Helper to attach cookie to response if we are recording this scan
  const applyAntiSpamCookie = (response: NextResponse) => {
    if (shouldRecordAnalytics) {
      // 1 hour cooldown for analytics (3600 seconds)
      response.cookies.set(cookieName, '1', { maxAge: 3600, httpOnly: true });
    }
    return response;
  };

  // 1. ULTRA-FAST REDIS HIT (~20-40ms): Zero database wait time
  const cached = await getCachedCard(slug);
  const canUpgradeReviewUrl = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  if (
    cached &&
    (!canUpgradeReviewUrl || isDirectGoogleReviewUrl(cached.google_review_url))
  ) {
    if (shouldRecordAnalytics) {
      after(() => recordScan(cached.card_id, userAgent));
    }

    const response = NextResponse.redirect(cached.google_review_url, {
      status: 307,
      headers: {
        'X-TapFlow-Cache': 'HIT-REDIS',
      },
    });
    
    return applyAntiSpamCookie(response);
  }

  // 2. CACHE MISS: Query primary database
  let card;
  try {
    card = await db.query.cards.findFirst({
      where: eq(cards.slug, slug),
      columns: {
        id: true,
        slug: true,
        businessName: true,
        googleReviewUrl: true,
        location: true,
        status: true,
      },
    });
  } catch (err) {
    console.error(`Database query failed for slug "${slug}":`, err);
    return new NextResponse('Service temporarily unavailable', { status: 503 });
  }

  // 3. Card Not Found (404)
  if (!card) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <title>Kartu Tidak Ditemukan - TapFlow</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;padding:4rem 1.5rem;background:#f8fafc;color:#0f172a;">
        <div style="max-width:400px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;padding:2.5rem;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <h1 style="font-size:3rem;margin:0;color:#3b82f6;font-weight:900;">404</h1>
          <h2 style="font-size:1.25rem;margin:1rem 0 0.5rem;color:#0f172a;">Kartu Tidak Ditemukan</h2>
          <p style="color:#64748b;font-size:0.875rem;line-height:1.5;">Kartu TapFlow dengan kode serial <code style="color:#2563eb;font-weight:bold;background:#eff6ff;padding:2px 6px;border-radius:6px;">${slug}</code> belum terdaftar dalam sistem.</p>
          <p style="color:#94a3b8;font-size:0.75rem;margin-top:2rem;border-top:1px solid #f1f5f9;padding-top:1rem;">TapFlow &bull; Powered by InvictusWave</p>
        </div>
      </body>
      </html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 4. Unassigned Card: Redirect to activation onboarding
  if (card.status === 'unassigned' || !card.googleReviewUrl) {
    return NextResponse.redirect(`${origin}/activate/${slug}`, { status: 307 });
  }

  let reviewUrl = card.googleReviewUrl;
  if (!isDirectGoogleReviewUrl(reviewUrl) && process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const directUrl = await resolveDirectGoogleReviewUrl(
        card.businessName ?? '',
        card.location,
        process.env.GOOGLE_PLACES_API_KEY
      );

      if (directUrl) {
        reviewUrl = directUrl;
        await db
          .update(cards)
          .set({ googleReviewUrl: directUrl, updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(cards.id, card.id));
      }
    } catch (err) {
      console.error(`Failed to resolve direct review URL for slug "${slug}":`, err);
    }
  }

  // 5. Active Card: Warm Redis Cache and redirect immediately
  const cacheData: CachedCard = {
    google_review_url: reviewUrl,
    business_name: card.businessName ?? '',
    card_id: card.id,
  };

  // Keep the redirect fast while Vercel extends the invocation for cache/analytics writes.
  after(async () => {
    await Promise.all([
      setCachedCard(slug, cacheData),
      shouldRecordAnalytics ? recordScan(card.id, userAgent) : Promise.resolve(),
    ]);
  });

  const response = NextResponse.redirect(reviewUrl, {
    status: 307,
    headers: {
      'X-TapFlow-Cache': 'MISS-WARMED',
    },
  });
  
  return applyAntiSpamCookie(response);
}
