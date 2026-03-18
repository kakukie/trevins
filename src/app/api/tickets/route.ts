import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getVendorLimits, isLimitExceeded } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const vendorId = searchParams.get('vendorId');
    const includeInactive = searchParams.get('includeInactive');

    const where: Record<string, unknown> = {};

    // Only filter by isActive if includeInactive is not set
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const tickets = await db.ticket.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    if (!user || !user.vendor) {
      return NextResponse.json(
        { error: 'Anda bukan vendor' },
        { status: 403 }
      );
    }

    const limits = await getVendorLimits(user.vendor.id);
    if (limits.maxTickets !== null) {
      const current = await db.ticket.count({ where: { vendorId: user.vendor.id } });
      if (isLimitExceeded(current, limits.maxTickets)) {
        return NextResponse.json(
          { error: `Limit tiket tercapai. Maksimal ${limits.maxTickets} tiket untuk paket Anda.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      eventId,
      name,
      description,
      type,
      price,
      discountPrice,
      quota,
      validFrom,
      validUntil,
      images,
    } = body;

    const sku = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const ticket = await db.ticket.create({
      data: {
        eventId: eventId || null,
        vendorId: user.vendor.id,
        name,
        sku,
        description,
        type: type || 'ADULT',
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        quota: parseInt(quota),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        images: images ? JSON.stringify(images) : null,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

