import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  pricePerNight: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  capacity: z.number().int().positive().default(2),
  facilities: z.any().optional().nullable(),
  images: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rooms = await db.room.findMany({
      where: { accommodationId: id },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const accommodation = await db.accommodation.findUnique({ where: { id }, select: { id: true, vendorId: true } });
    if (!accommodation) return NextResponse.json({ error: 'Akomodasi tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && accommodation.vendorId === user.vendor.id;
    if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const created = await db.room.create({
      data: {
        accommodationId: accommodation.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        pricePerNight: parsed.data.pricePerNight,
        discountPrice: parsed.data.discountPrice ?? null,
        capacity: parsed.data.capacity,
        facilities: parsed.data.facilities ? JSON.stringify(parsed.data.facilities) : null,
        images: parsed.data.images ? JSON.stringify(parsed.data.images) : null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

