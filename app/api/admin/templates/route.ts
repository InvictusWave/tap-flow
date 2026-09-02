import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customTemplates } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
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

    return NextResponse.json({
      templates: formattedDbTemplates,
    });
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
