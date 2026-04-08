import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { sendBookingConfirmationEmail } from '@/lib/brevo';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;

    if (user.role !== 'VENDOR' || !user.vendor) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { action } = await request.json(); // action == 'APPROVE' or 'CANCEL'

    const booking = await db.accommodationBooking.findUnique({
      where: { id: params.id, vendorId: user.vendor.id },
      include: { accommodation: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const updated = await db.accommodationBooking.update({
        where: { id: params.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      });

      if (updated.guestEmail) {
        await sendBookingConfirmationEmail(
          updated.guestEmail,
          updated.bookingCode,
          `Penginapan: ${booking.accommodation.name}`,
          updated.finalAmount
        );
      }
      return NextResponse.json(updated);
    } else if (action === 'CANCEL') {
      const updated = await db.accommodationBooking.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Approve accommodation booking error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
