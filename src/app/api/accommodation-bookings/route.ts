import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  accommodationId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1).max(20).optional(),
  guestName: z.string().min(2),
  guestPhone: z.string().min(6),
  guestEmail: z.string().email(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  vendorPaymentMethodId: z.string().optional().nullable(),
});

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function bookingCode(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const where: any = {};
    if (user.role === 'USER') {
      where.userId = user.id;
    } else if (user.role === 'VENDOR' && user.vendor) {
      where.vendorId = user.vendor.id;
    }

    const bookings = await db.accommodationBooking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vendor: { select: { id: true, businessName: true } },
        accommodation: { select: { id: true, name: true, images: true, city: true } },
        room: { select: { id: true, name: true, pricePerNight: true, discountPrice: true, capacity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Get accommodation bookings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true, roles: ['USER'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const accommodation = await db.accommodation.findUnique({
      where: { id: parsed.data.accommodationId },
      select: { id: true, vendorId: true, isActive: true },
    });
    if (!accommodation || !accommodation.isActive) {
      return NextResponse.json({ error: 'Penginapan tidak ditemukan' }, { status: 404 });
    }

    const vendor = await db.vendor.findUnique({
      where: { id: accommodation.vendorId },
      select: { id: true, userId: true, businessName: true, isActive: true, subscriptionStatus: true },
    });
    if (!vendor || !vendor.isActive || vendor.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Vendor sedang tidak aktif' }, { status: 403 });
    }

    const room = await db.room.findFirst({
      where: { id: parsed.data.roomId, accommodationId: accommodation.id, isActive: true },
      select: { id: true, pricePerNight: true, discountPrice: true, capacity: true },
    });
    if (!room) {
      return NextResponse.json({ error: 'Kamar tidak ditemukan' }, { status: 404 });
    }

    const checkIn = new Date(parsed.data.checkIn);
    const checkOut = new Date(parsed.data.checkOut);
    if (!(checkIn instanceof Date) || isNaN(checkIn.getTime()) || !(checkOut instanceof Date) || isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: 'Tanggal tidak valid' }, { status: 400 });
    }
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out harus setelah check-in' }, { status: 400 });
    }

    const nights = daysBetween(checkIn, checkOut);
    const nightly = room.discountPrice && room.discountPrice > 0 ? room.discountPrice : room.pricePerNight;
    const totalAmount = nightly * nights;
    const discountAmount = room.discountPrice ? (room.pricePerNight - room.discountPrice) * nights : 0;
    const finalAmount = totalAmount;

    const paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const created = await db.accommodationBooking.create({
      data: {
        bookingCode: bookingCode('STY'),
        userId: user.id,
        vendorId: accommodation.vendorId,
        accommodationId: accommodation.id,
        roomId: room.id,
        checkIn,
        checkOut,
        nights,
        guests: parsed.data.guests ?? 1,
        status: 'PENDING',
        totalAmount,
        discountAmount,
        finalAmount,
        paymentMethod: parsed.data.paymentMethod || null,
        vendorPaymentMethodId: parsed.data.vendorPaymentMethodId || null,
        paymentStatus: 'UNPAID',
        paymentDeadline,
        qrCode: `trevins://stay/${Date.now()}`,
        notes: parsed.data.notes || null,
        guestName: parsed.data.guestName,
        guestPhone: parsed.data.guestPhone,
        guestEmail: parsed.data.guestEmail,
      },
    });

    // Create notifications (vendor + user) for visibility.
    await db.notification.createMany({
      data: [
        {
          userId: vendor.userId,
          title: 'Booking Penginapan Baru',
          message: `Ada booking penginapan baru (${created.bookingCode}).`,
          type: 'BOOKING',
          data: JSON.stringify({ accommodationBookingId: created.id, bookingCode: created.bookingCode }),
        },
        {
          userId: user.id,
          title: 'Booking Penginapan Dibuat',
          message: `Booking penginapan Anda berhasil dibuat (${created.bookingCode}).`,
          type: 'BOOKING',
          data: JSON.stringify({ accommodationBookingId: created.id, bookingCode: created.bookingCode }),
        },
      ],
      skipDuplicates: false,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create accommodation booking error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
