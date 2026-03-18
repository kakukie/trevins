import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const planSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  maxEvents: z.number().int().positive().optional().nullable(),
  maxTickets: z.number().int().positive().optional().nullable(),
  maxAccommodations: z.number().int().positive().optional().nullable(),
  maxCategories: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request, { roles: ['ADMIN'] });
    if (auth.error) return auth.error;

    const plans = await db.subscriptionPlan.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { roles: ['ADMIN'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const created = await db.subscriptionPlan.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        maxEvents: parsed.data.maxEvents ?? null,
        maxTickets: parsed.data.maxTickets ?? null,
        maxAccommodations: parsed.data.maxAccommodations ?? null,
        maxCategories: parsed.data.maxCategories ?? null,
        isActive: parsed.data.isActive ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

