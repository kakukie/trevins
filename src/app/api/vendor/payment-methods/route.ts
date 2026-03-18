import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const paymentMethodSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  provider: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  qrString: z.string().optional().nullable(),
  qrImageUrl: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth(request, { includeVendor: true, roles: ['VENDOR'] });
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (!user.vendor) {
    return NextResponse.json({ error: 'Anda bukan vendor' }, { status: 403 });
  }

  const methods = await db.vendorPaymentMethod.findMany({
    where: { vendorId: user.vendor.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(methods);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { includeVendor: true, roles: ['VENDOR'] });
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (!user.vendor) {
    return NextResponse.json({ error: 'Anda bukan vendor' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = paymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
  }

  const created = await db.vendorPaymentMethod.create({
    data: {
      vendorId: user.vendor.id,
      type: parsed.data.type,
      label: parsed.data.label,
      provider: parsed.data.provider || null,
      accountName: parsed.data.accountName || null,
      accountNumber: parsed.data.accountNumber || null,
      qrString: parsed.data.qrString || null,
      qrImageUrl: parsed.data.qrImageUrl || null,
      instructions: parsed.data.instructions || null,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
