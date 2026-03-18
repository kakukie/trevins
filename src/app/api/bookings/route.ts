import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true });
    if (auth.error) return auth.error;
    const user = auth.user!;
    const userId = user.id;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let where: Record<string, unknown> = {};

    // For admin, get all bookings
    if (user.role === 'ADMIN') {
      // No user filter - get all bookings
    } 
    // For vendors, get bookings that contain their tickets
    else if (user.role === 'VENDOR' && user.vendor) {
      where = {
        items: {
          some: {
            ticket: {
              vendorId: user.vendor.id,
            },
          },
        },
      };
    } 
    // For regular users, get their own bookings
    else {
      where = {
        userId,
      };
    }

    if (status) {
      where.status = status;
    }

    let bookings = await db.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            images: true,
            category: true,
            address: true,
            city: true,
            validFrom: true,
          },
        },
        items: {
          include: {
            ticket: {
              select: {
                id: true,
                name: true,
                type: true,
                vendorId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse images from JSON string to array
    const processedBookings = bookings.map(booking => ({
      ...booking,
      event: booking.event ? {
        ...booking.event,
        images: typeof booking.event.images === 'string' ? JSON.parse(booking.event.images) : booking.event.images,
      } : null,
    }));

    // Filter by search if provided
    let filteredBookings = processedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = processedBookings.filter(booking => 
        booking.bookingCode.toLowerCase().includes(searchLower) ||
        booking.user.name.toLowerCase().includes(searchLower) ||
        booking.user.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(filteredBookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { error: 'Unauthorized - Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }
    const user = auth.user!;
    const userId = user.id;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User tidak ditemukan' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, items, notes, paymentMethod, vendorPaymentMethodId } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal 1 tiket untuk booking' },
        { status: 400 }
      );
    }

    // Generate booking code
    const bookingCode = `TRP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const booking = await db.$transaction(async (tx) => {
      let totalAmount = 0;
      let bookingVendorId: string | null = null;
      const bookingItems: Array<{
        ticketId: string;
        quantity: number;
        price: number;
        subtotal: number;
      }> = [];

      for (const item of items) {
        if (!item?.ticketId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error('Format item booking tidak valid');
        }

        const ticket = await tx.ticket.findUnique({
          where: { id: item.ticketId },
        });

        if (!ticket) {
          throw new Error('Tiket tidak ditemukan');
        }

        if (!ticket.isActive) {
          throw new Error(`Tiket ${ticket.name} tidak tersedia`);
        }

        // Enforce single vendor per booking (required for vendor payment methods)
        if (!bookingVendorId) {
          bookingVendorId = ticket.vendorId;
        } else if (bookingVendorId !== ticket.vendorId) {
          throw new Error('Booking hanya dapat berisi tiket dari 1 vendor');
        }

        const availableQuota = ticket.quota - ticket.sold;
        if (item.quantity > availableQuota) {
          throw new Error(`Tiket ${ticket.name} hanya tersisa ${availableQuota} tiket`);
        }

        const optimisticUpdate = await tx.ticket.updateMany({
          where: {
            id: ticket.id,
            sold: ticket.sold,
          },
          data: {
            sold: { increment: item.quantity },
          },
        });

        if (optimisticUpdate.count === 0) {
          throw new Error(`Stok tiket ${ticket.name} berubah, silakan coba lagi`);
        }

        const price = ticket.discountPrice || ticket.price;
        const subtotal = price * item.quantity;
        totalAmount += subtotal;

        bookingItems.push({
          ticketId: item.ticketId,
          quantity: item.quantity,
          price,
          subtotal,
        });
      }

      let resolvedPaymentMethod = paymentMethod || 'TRANSFER';
      let resolvedVendorPaymentMethodId: string | null = null;

      if (vendorPaymentMethodId) {
        if (!bookingVendorId) {
          throw new Error('Vendor tidak ditemukan untuk booking ini');
        }
        const method = await tx.vendorPaymentMethod.findUnique({
          where: { id: vendorPaymentMethodId },
        });
        if (!method || method.vendorId !== bookingVendorId || !method.isActive) {
          throw new Error('Metode pembayaran vendor tidak valid');
        }
        resolvedPaymentMethod = method.type;
        resolvedVendorPaymentMethodId = method.id;
      }

      // Prevent booking to inactive vendors (SaaS subscription)
      if (bookingVendorId) {
        const bookingVendor = await tx.vendor.findUnique({
          where: { id: bookingVendorId },
          select: { isActive: true, subscriptionStatus: true },
        });
        if (!bookingVendor || !bookingVendor.isActive || bookingVendor.subscriptionStatus !== 'ACTIVE') {
          throw new Error('Vendor sedang nonaktif, booking tidak dapat diproses');
        }
      }

      const createdBooking = await tx.booking.create({
        data: {
          bookingCode,
          userId,
          eventId: eventId || null,
          vendorId: bookingVendorId,
          totalAmount,
          finalAmount: totalAmount,
          discountAmount: 0,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod: resolvedPaymentMethod,
          vendorPaymentMethodId: resolvedVendorPaymentMethodId,
          paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          notes,
          items: {
            create: bookingItems,
          },
        },
        include: {
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
          event: true,
          vendorPaymentMethod: true,
        },
      });

      if (eventId) {
        await tx.event.update({
          where: { id: eventId },
          data: { totalSales: { increment: 1 } },
        });
      }

      return createdBooking;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    if (
      error instanceof Error &&
      /format item booking|tidak ditemukan|tidak tersedia|hanya tersisa|stok tiket berubah/i.test(error.message)
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

