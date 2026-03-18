import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const where: any = {};
    if (user.role === 'VENDOR' && user.vendor) {
      where.vendorId = user.vendor.id;
    }

    const accommodations = await db.accommodation.findMany({
      where,
      include: {
        rooms: true,
        _count: { select: { bookings: true, reviews: true, rooms: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return NextResponse.json(accommodations);
  } catch (error) {
    console.error('Get vendor accommodations error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

