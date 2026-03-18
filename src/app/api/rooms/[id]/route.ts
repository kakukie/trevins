import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  pricePerNight: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  capacity: z.number().int().positive().optional(),
  facilities: z.any().optional().nullable(),
  images: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const room = await db.room.findUnique({ where: { id }, include: { accommodation: { select: { vendorId: true } } } });
    if (!room) return NextResponse.json({ error: 'Kamar tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && room.accommodation.vendorId === user.vendor.id;
    if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (parsed.data.facilities !== undefined) data.facilities = parsed.data.facilities ? JSON.stringify(parsed.data.facilities) : null;
    if (parsed.data.images !== undefined) data.images = parsed.data.images ? JSON.stringify(parsed.data.images) : null;

    const updated = await db.room.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update room error:', error);
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

    const room = await db.room.findUnique({ where: { id }, include: { accommodation: { select: { vendorId: true } } } });
    if (!room) return NextResponse.json({ error: 'Kamar tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && room.accommodation.vendorId === user.vendor.id;
    if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });

    const updated = await db.room.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

