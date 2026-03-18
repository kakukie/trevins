import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { slugify } from '@/lib/slug';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['EVENT', 'ACCOMMODATION']).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const category = await db.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.role === 'VENDOR' && user.vendor && category.ownerKey === user.vendor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const data: any = {};
    if (parsed.data.name !== undefined) {
      data.name = parsed.data.name;
      data.slug = slugify(parsed.data.name);
    }
    if (parsed.data.type !== undefined) data.type = parsed.data.type;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

    try {
      const updated = await db.category.update({ where: { id }, data });
      return NextResponse.json(updated);
    } catch (e: any) {
      // Handle unique constraint: @@unique([slug, type, ownerKey])
      if (e?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Kategori dengan nama/slug yang sama sudah ada untuk tipe tersebut.' },
          { status: 409 }
        );
      }
      throw e;
    }
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const category = await db.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.role === 'VENDOR' && user.vendor && category.ownerKey === user.vendor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });
    }

    // Soft delete: deactivate
    const updated = await db.category.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
