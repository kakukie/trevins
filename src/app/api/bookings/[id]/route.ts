import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBookingCode } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const currentUser = auth.user!;
    const userId = currentUser?.id;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        event: true,
        items: {
          include: {
            ticket: {
              include: {
                event: true,
              },
            },
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

    const isAdmin = currentUser?.role === 'ADMIN';
    const isOwner = booking.userId === userId;
    const isVendorOwner = !!(
      currentUser?.vendor &&
      booking.items.some((item) => item.ticket.vendorId === currentUser.vendor?.id)
    );

    if (!isAdmin && !isOwner && !isVendorOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
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

    const body = await request.json();
    const { status, paymentStatus, paymentMethod } = body;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            ticket: {
              select: {
                vendorId: true,
              },
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

    const isAdmin = user.role === 'ADMIN';
    const isOwner = booking.userId === userId;
    const isVendorOwner = !!(
      user.vendor &&
      booking.items.some((item) => item.ticket.vendorId === user.vendor?.id)
    );

    if (!isAdmin && !isOwner && !isVendorOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    if (isOwner && !isAdmin && !isVendorOwner) {
      if (status && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'User hanya dapat membatalkan booking sendiri' },
          { status: 403 }
        );
      }
      if (paymentStatus || paymentMethod) {
        return NextResponse.json(
          { error: 'User tidak dapat mengubah status pembayaran' },
          { status: 403 }
        );
      }
    }

    // Generate QR code if paid
    let qrCode = booking.qrCode;
    if (paymentStatus === 'PAID' && !qrCode) {
      qrCode = generateBookingCode();
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status,
        paymentStatus,
        paymentMethod,
        qrCode,
      },
    });

    // Create transaction if paid
    const existingTransaction = await db.transaction.findFirst({
      where: { bookingId: booking.id },
    });
    
    if (paymentStatus === 'PAID' && !existingTransaction) {
      await db.transaction.create({
        data: {
          transactionCode: `TRX${Date.now().toString(36).toUpperCase()}`,
          userId: booking.userId,
          bookingId: booking.id,
          amount: booking.finalAmount,
          paymentMethod: paymentMethod || 'UNKNOWN',
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

