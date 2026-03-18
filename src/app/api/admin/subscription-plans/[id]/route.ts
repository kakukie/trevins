import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  maxEvents: z.number().int().positive().optional().nullable(),
  maxTickets: z.number().int().positive().optional().nullable(),
  maxAccommodations: z.number().int().positive().optional().nullable(),
  maxCategories: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { roles: ['ADMIN'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: {
        ...parsed.data,
        description: parsed.data.description ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update subscription plan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request, { roles: ['ADMIN'] });
    if (auth.error) return auth.error;

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

