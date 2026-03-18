import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getVendorLimits, isLimitExceeded } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const vendorId = searchParams.get('vendorId');
    const featured = searchParams.get('featured');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const where: Record<string, unknown> = {};

    // Handle isActive filter
    if (isActive === 'all') {
      // Don't filter by isActive - show all events
    } else if (isActive === 'false') {
      where.isActive = false;
    } else {
      // Default: only show active events
      where.isActive = true;
    }

    if (category && category !== 'semua' && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        include: {
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
          tickets: {
            where: { isActive: true },
            take: 3,
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { totalSales: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
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
    if (limits.maxEvents !== null) {
      const current = await db.event.count({ where: { vendorId: user.vendor.id } });
      if (isLimitExceeded(current, limits.maxEvents)) {
        return NextResponse.json(
          { error: `Limit event tercapai. Maksimal ${limits.maxEvents} event untuk paket Anda.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      images,
      address,
      city,
      latitude,
      longitude,
      validFrom,
      validUntil,
      isFeatured,
    } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const event = await db.event.create({
      data: {
        vendorId: user.vendor.id,
        name,
        slug: `${slug}-${Date.now()}`,
        description,
        category,
        images: JSON.stringify(images || []),
        address,
        city,
        latitude,
        longitude,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isFeatured: isFeatured || false,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

