import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isVerified = searchParams.get('isVerified');

    const where: Record<string, unknown> = {};

    if (isVerified !== null) {
      where.isVerified = isVerified === 'true';
    }

    const vendors = await db.vendor.findMany({
      where,
      include: {
        subscriptionPlan: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            events: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
