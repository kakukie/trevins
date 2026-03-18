import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  category: z.string().min(1).optional(),
  images: z.any().optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
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
        tickets: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
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
          select: { reviews: true, tickets: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Get event error:', error);
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

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan' },
        { status: 404 }
      );
    }

    // Allow admin or vendor owner to update
    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && event.vendorId === user.vendor.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Input tidak valid', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.images !== undefined) {
      updateData.images = JSON.stringify(parsed.data.images);
    }
    if (parsed.data.validFrom) {
      updateData.validFrom = new Date(parsed.data.validFrom);
    }
    if (parsed.data.validUntil) {
      updateData.validUntil = new Date(parsed.data.validUntil);
    }

    const updatedEvent = await db.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
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

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan' },
        { status: 404 }
      );
    }

    // Allow admin or vendor owner to delete
    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.vendor && event.vendorId === user.vendor.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    await db.event.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Event berhasil dihapus' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

