import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customTemplates } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { deleteCachedValue, TEMPLATES_CACHE_KEY } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Check DB for custom template
    const [template] = await db
      .select()
      .from(customTemplates)
      .where(eq(customTemplates.id, id))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { error: 'Template tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        aspect: template.aspect,
        width: template.width,
        height: template.height,
        background: template.background,
        elements: JSON.parse(template.elements || '[]'),
        thumbnail: template.thumbnail,
        isCustom: true,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail template.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, aspect, width, height, background, elements, thumbnail } = body;

    const [existing] = await db
      .select()
      .from(customTemplates)
      .where(eq(customTemplates.id, id))
      .limit(1);

    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      await db
        .update(customTemplates)
        .set({
          ...(name ? { name: name.trim() } : {}),
          ...(aspect ? { aspect } : {}),
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
          ...(background ? { background } : {}),
          ...(elements ? { elements: JSON.stringify(elements) } : {}),
          ...(thumbnail !== undefined ? { thumbnail } : {}),
          updatedAt: now,
        })
        .where(eq(customTemplates.id, id));
      await deleteCachedValue(TEMPLATES_CACHE_KEY);

      return NextResponse.json({
        message: 'Template berhasil diperbarui!',
        id,
      });
    } else {
      // If it's a preset or new ID being saved as a custom template
      await db.insert(customTemplates).values({
        id,
        name: name?.trim() || 'Custom Template',
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

      return NextResponse.json({
        message: 'Template berhasil disimpan sebagai template kustom baru!',
        id,
      });
    }
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui template.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;

    await db.delete(customTemplates).where(eq(customTemplates.id, id));
    await deleteCachedValue(TEMPLATES_CACHE_KEY);

    return NextResponse.json({
      message: 'Template kustom berhasil dihapus.',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus template.' },
      { status: 500 }
    );
  }
}
