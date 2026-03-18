import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getVendorLimits, isLimitExceeded } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const accommodations = await db.accommodation.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        rooms: {
          where: { isActive: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { rating: 'desc' },
      ],
    });

    return NextResponse.json(accommodations);
  } catch (error) {
    console.error('Get accommodations error:', error);
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

    // Subscription limits (vendor only)
    const limits = await getVendorLimits(user.vendor.id);
    if (limits.maxAccommodations !== null) {
      const current = await db.accommodation.count({ where: { vendorId: user.vendor.id } });
      if (isLimitExceeded(current, limits.maxAccommodations)) {
        return NextResponse.json(
          { error: `Limit penginapan tercapai. Maksimal ${limits.maxAccommodations} penginapan untuk paket Anda.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      address,
      city,
      latitude,
      longitude,
      images,
      facilities,
      totalRooms,
      pricePerNight,
      discountPrice,
      isFeatured,
    } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const accommodation = await db.accommodation.create({
      data: {
        vendorId: user.vendor.id,
        name,
        slug: `${slug}-${Date.now()}`,
        description,
        type: type || 'KOS',
        address,
        city,
        latitude,
        longitude,
        images: JSON.stringify(images || []),
        facilities: facilities ? JSON.stringify(facilities) : null,
        totalRooms: parseInt(totalRooms),
        availableRooms: parseInt(totalRooms),
        pricePerNight: parseFloat(pricePerNight),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        isFeatured: isFeatured || false,
      },
    });

    // Ensure at least one active room exists so booking flow can work.
    await db.room.create({
      data: {
        accommodationId: accommodation.id,
        name: 'Standard Room',
        description: 'Kamar standar',
        pricePerNight: accommodation.pricePerNight,
        discountPrice: accommodation.discountPrice,
        capacity: 2,
        facilities: accommodation.facilities,
        isActive: true,
      },
    });

    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    console.error('Create accommodation error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

