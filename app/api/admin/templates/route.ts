import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customTemplates } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getAdminSession } from '@/lib/auth';
import {
  deleteCachedValue,
  getCachedValue,
  setCachedValue,
  TEMPLATES_CACHE_KEY,
} from '@/lib/redis';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const cached = await getCachedValue<unknown[]>(TEMPLATES_CACHE_KEY);
    if (cached) {
      return NextResponse.json(
        { templates: cached },
        {
          headers: {
            'X-TapFlow-Cache': 'HIT-REDIS',
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
          },
        }
      );
    }

    const dbTemplates = await db
      .select()
      .from(customTemplates)
      .orderBy(desc(customTemplates.updatedAt));

    const formattedDbTemplates = dbTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      aspect: t.aspect,
      width: t.width,
      height: t.height,
      background: t.background,
      elements: JSON.parse(t.elements || '[]'),
      thumbnail: t.thumbnail,
      isCustom: true,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    await setCachedValue(TEMPLATES_CACHE_KEY, formattedDbTemplates, 300);

    return NextResponse.json(
      { templates: formattedDbTemplates },
      {
        headers: {
          'X-TapFlow-Cache': 'MISS-WARMED',
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Gagal memuat template.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { name, aspect, width, height, background, elements, thumbnail } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama template wajib diisi.' },
        { status: 400 }
      );
    }

    const templateId = `custom-${nanoid(8)}`;
    const now = Math.floor(Date.now() / 1000);

    await db.insert(customTemplates).values({
      id: templateId,
      name: name.trim(),
      aspect: aspect || 'square',
      width: width || 500,
      height: height || 500,
      background: background || '#ffffff',
      elements: JSON.stringify(elements || []),
      thumbnail: thumbnail || null,
      createdAt: now,
      updatedAt: now,
    });
    await deleteCachedValue(TEMPLATES_CACHE_KEY);

    return NextResponse.json(
      {
        message: 'Template berhasil disimpan!',
        data: {
          id: templateId,
          name: name.trim(),
          aspect,
          width,
          height,
          background,
          elements,
          thumbnail,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan template ke database.' },
      { status: 500 }
    );
  }
}
