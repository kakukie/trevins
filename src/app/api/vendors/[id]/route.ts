import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const vendorSelfUpdateSchema = z.object({
  businessName: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

const vendorAdminUpdateSchema = vendorSelfUpdateSchema.extend({
  isVerified: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        events: {
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            events: true,
            tickets: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Get vendor error:', error);
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
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user!;
    const userId = user?.id;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendor = await db.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor tidak ditemukan' },
        { status: 404 }
      );
    }

    // Only allow admin or vendor owner to update
    if (user.role !== 'ADMIN' && vendor.userId !== userId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const isAdmin = user.role === 'ADMIN';
    const parsed = (isAdmin ? vendorAdminUpdateSchema : vendorSelfUpdateSchema).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Input tidak valid', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updatedVendor = await db.vendor.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

