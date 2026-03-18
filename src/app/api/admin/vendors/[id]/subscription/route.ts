import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const bodySchema = z.object({
  isActive: z.boolean().optional(),
  subscriptionStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  subscriptionEndsAt: z.string().datetime().optional().nullable(),
  subscriptionPlanId: z.string().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, { roles: ['ADMIN'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const vendor = await db.vendor.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const isActive = parsed.data.isActive;
    const subscriptionStatus = parsed.data.subscriptionStatus;
    const subscriptionEndsAt = parsed.data.subscriptionEndsAt ?? undefined;

    const updatedVendor = await db.vendor.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(subscriptionStatus ? { subscriptionStatus } : {}),
        ...(parsed.data.subscriptionEndsAt !== undefined ? { subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : null } : {}),
        ...(parsed.data.subscriptionPlanId !== undefined ? { subscriptionPlanId: parsed.data.subscriptionPlanId || null } : {}),
      },
    });

    // Ensure vendor owner account aligns with vendor activation for access control.
    if (typeof isActive === 'boolean') {
      await db.user.update({
        where: { id: vendor.userId },
        data: { isActive },
      });
    }

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor subscription error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
