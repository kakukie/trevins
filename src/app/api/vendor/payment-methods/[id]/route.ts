import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const patchSchema = z.object({
  type: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  qrString: z.string().optional().nullable(),
  qrImageUrl: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, { includeVendor: true, roles: ['VENDOR'] });
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (!user.vendor) {
    return NextResponse.json({ error: 'Anda bukan vendor' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.vendorPaymentMethod.findUnique({ where: { id } });
  if (!existing || existing.vendorId !== user.vendor.id) {
    return NextResponse.json({ error: 'Metode pembayaran tidak ditemukan' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
  }

  const updated = await db.vendorPaymentMethod.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, { includeVendor: true, roles: ['VENDOR'] });
  if (auth.error) return auth.error;
  const user = auth.user!;
  if (!user.vendor) {
    return NextResponse.json({ error: 'Anda bukan vendor' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.vendorPaymentMethod.findUnique({ where: { id } });
  if (!existing || existing.vendorId !== user.vendor.id) {
    return NextResponse.json({ error: 'Metode pembayaran tidak ditemukan' }, { status: 404 });
  }

  await db.vendorPaymentMethod.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
