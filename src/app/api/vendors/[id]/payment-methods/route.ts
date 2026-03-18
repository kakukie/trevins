import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendor = await db.vendor.findUnique({
      where: { id },
      select: { id: true, isActive: true, subscriptionStatus: true },
    });

    if (!vendor || !vendor.isActive || vendor.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json([], { status: 200 });
    }

    const methods = await db.vendorPaymentMethod.findMany({
      where: { vendorId: id, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        vendorId: true,
        type: true,
        label: true,
        provider: true,
        accountName: true,
        accountNumber: true,
        qrString: true,
        qrImageUrl: true,
        instructions: true,
      },
    });

    return NextResponse.json(methods);
  } catch (error) {
    console.error('Get vendor payment methods error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
