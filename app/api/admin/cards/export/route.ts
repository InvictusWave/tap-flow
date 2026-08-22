import { db } from '@/lib/db';
import { cards } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'csv';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const allCards = await db.query.cards.findMany({
    orderBy: [desc(cards.createdAt)],
    columns: {
      id: true,
      slug: true,
      businessName: true,
      location: true,
      template: true,
      googleReviewUrl: true,
      status: true,
      totalScans: true,
      createdAt: true,
    },
  });

  if (format === 'csv') {
    const headers = [
      'ID',
      'Slug',
      'Redirect URL (NFC Target)',
      'Activate URL',
      'Nama Bisnis',
      'Lokasi / Cabang',
      'Template Desain',
      'Google Review URL',
      'Status',
      'Total Scan',
      'Dibuat',
    ];

    const rows = allCards.map((card) => [
      card.id,
      card.slug,
      `${appUrl}/c/${card.slug}`,
      `${appUrl}/activate/${card.slug}`,
      card.businessName ?? '',
      card.location ?? '',
      card.template ?? 'premium_black',
      card.googleReviewUrl ?? '',
      card.status,
      card.totalScans,
      new Date(card.createdAt * 1000).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tapflow-cards-export.csv"',
      },
    });
  }

  // JSON format
  return NextResponse.json(
    allCards.map((card) => ({
      ...card,
      redirect_url: `${appUrl}/c/${card.slug}`,
      activate_url: `${appUrl}/activate/${card.slug}`,
    }))
  );
}
