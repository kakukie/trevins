import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  type: z.string().optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  images: z.any().optional(),
  facilities: z.any().optional().nullable(),
  totalRooms: z.number().int().positive().optional(),
  availableRooms: z.number().int().nonnegative().optional(),
  pricePerNight: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accommodation = await db.accommodation.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        rooms: {
          where: { isActive: true },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reviews: true, rooms: true },
        },
      },
    });

    if (!accommodation) {
      return NextResponse.json(
        { error: 'Akomodasi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(accommodation);
  } catch (error) {
    console.error('Get accommodation error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const accommodation = await db.accommodation.findUnique({ where: { id } });
    if (!accommodation) {
      return NextResponse.json({ error: 'Akomodasi tidak ditemukan' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && accommodation.vendorId === user.vendor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (parsed.data.images !== undefined) data.images = JSON.stringify(parsed.data.images);
    if (parsed.data.facilities !== undefined) {
      data.facilities = parsed.data.facilities ? JSON.stringify(parsed.data.facilities) : null;
    }

    const updated = await db.accommodation.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update accommodation error:', error);
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

    const accommodation = await db.accommodation.findUnique({ where: { id } });
    if (!accommodation) {
      return NextResponse.json({ error: 'Akomodasi tidak ditemukan' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && accommodation.vendorId === user.vendor.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });
    }

    const updated = await db.accommodation.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Delete accommodation error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
