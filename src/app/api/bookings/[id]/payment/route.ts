import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBookingCode } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';

// POST - Confirm payment for a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;
    const userId = user?.id;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            ticket: {
              include: { vendor: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check authorization:
    // - Admin can confirm any payment
    // - Vendor can confirm payments for their tickets
    // - User can confirm their own payment (simulate payment)
    const isAdmin = user.role === 'ADMIN';
    const isVendorOwner = user.vendor && booking.items.some(
      item => item.ticket.vendorId === user.vendor?.id
    );
    const isBookingOwner = booking.userId === userId;

    if (!isAdmin && !isVendorOwner && !isBookingOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    // Check if already paid
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Booking sudah dibayar' },
        { status: 400 }
      );
    }

    // Check if booking is expired
    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Booking sudah dibatalkan atau kedaluwarsa' },
        { status: 400 }
      );
    }

    // Generate QR code for the booking
    const qrCode = generateBookingCode();

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        qrCode,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        event: true,
        items: {
          include: {
            ticket: {
              include: {
                event: true,
                vendor: true,
              },
            },
          },
        },
      },
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        transactionCode: `TRX${Date.now().toString(36).toUpperCase()}`,
        userId: booking.userId,
        bookingId: booking.id,
        amount: booking.finalAmount,
        paymentMethod: booking.paymentMethod || 'TRANSFER',
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil dikonfirmasi',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// GET - Get payment status for a booking
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;
    const userId = user?.id;

    const booking = await db.booking.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        bookingCode: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentDeadline: true,
        totalAmount: true,
        finalAmount: true,
        qrCode: true,
        createdAt: true,
        event: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            ticket: { select: { name: true } },
          },
        },
        transaction: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check authorization
    const isAdmin = user?.role === 'ADMIN';
    const isBookingOwner = booking.userId === userId;

    if (!isAdmin && !isBookingOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

