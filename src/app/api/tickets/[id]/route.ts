import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  eventId: z.string().optional().nullable(),
  name: z.string().min(2).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.string().min(1).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  discountPrice: z.union([z.number(), z.string()]).optional().nullable(),
  quota: z.union([z.number(), z.string()]).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().optional(),
  images: z.any().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Tiket tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
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

    const ticket = await db.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Tiket tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && ticket.vendorId !== user.vendor?.id) {
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

    // If vendor attempts to change eventId, ensure the event belongs to them.
    if (parsed.data.eventId && user.role !== 'ADMIN') {
      const event = await db.event.findUnique({
        where: { id: parsed.data.eventId },
        select: { vendorId: true },
      });
      if (!event || event.vendorId !== user.vendor?.id) {
        return NextResponse.json(
          { error: 'Event tidak valid untuk tiket ini' },
          { status: 400 }
        );
      }
    }

    const updatedTicket = await db.ticket.update({
      where: { id },
      data: {
        ...parsed.data,
        price: parsed.data.price !== undefined ? parseFloat(String(parsed.data.price)) : undefined,
        discountPrice: parsed.data.discountPrice !== undefined && parsed.data.discountPrice !== null
          ? parseFloat(String(parsed.data.discountPrice))
          : parsed.data.discountPrice === null
            ? null
            : undefined,
        quota: parsed.data.quota !== undefined ? parseInt(String(parsed.data.quota), 10) : undefined,
        validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : undefined,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
        images: parsed.data.images !== undefined ? JSON.stringify(parsed.data.images) : undefined,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
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

    const ticket = await db.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Tiket tidak ditemukan' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && ticket.vendorId !== user.vendor?.id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    await db.ticket.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Tiket berhasil dihapus' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

