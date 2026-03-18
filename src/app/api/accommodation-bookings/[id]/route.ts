import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const updateSchema = z.object({
  status: z.string().optional(), // PENDING, CONFIRMED, PAID, CANCELLED
  paymentStatus: z.string().optional(), // UNPAID, PAID
  paymentMethod: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const booking = await db.accommodationBooking.findUnique({
      where: { id },
      select: { id: true, userId: true, vendorId: true, finalAmount: true, qrCode: true },
    });
    if (!booking) return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.role === 'USER' && booking.userId === user.id;
    const isVendorOwner = user.role === 'VENDOR' && user.vendor && booking.vendorId === user.vendor.id;

    if (!isAdmin && !isOwner && !isVendorOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses' }, { status: 403 });
    }

    // Users can only cancel their own booking; vendors/admin can confirm & mark paid.
    if (isOwner && !isAdmin && !isVendorOwner) {
      if (parsed.data.status && parsed.data.status !== 'CANCELLED') {
        return NextResponse.json({ error: 'User hanya dapat membatalkan booking sendiri' }, { status: 403 });
      }
      if (parsed.data.paymentStatus || parsed.data.paymentMethod) {
        return NextResponse.json({ error: 'User tidak dapat mengubah status pembayaran' }, { status: 403 });
      }
    }

    let qrCode = booking.qrCode;
    if (parsed.data.paymentStatus === 'PAID' && !qrCode) {
      qrCode = `trevins://stay/${Date.now()}`;
    }

    const updated = await db.accommodationBooking.update({
      where: { id },
      data: {
        status: parsed.data.status,
        paymentStatus: parsed.data.paymentStatus,
        paymentMethod: parsed.data.paymentMethod,
        qrCode,
      },
    });

    // Create transaction if marked as paid (manual validation by vendor/admin)
    const existingTransaction = await db.transaction.findFirst({
      where: { accommodationBookingId: booking.id },
      select: { id: true },
    });
    if (parsed.data.paymentStatus === 'PAID' && !existingTransaction) {
      await db.transaction.create({
        data: {
          transactionCode: `TRX${Date.now().toString(36).toUpperCase()}`,
          userId: booking.userId,
          accommodationBookingId: booking.id,
          amount: booking.finalAmount,
          paymentMethod: parsed.data.paymentMethod || 'UNKNOWN',
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update accommodation booking error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

