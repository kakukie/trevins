import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { slugify } from '@/lib/slug';
import { getVendorLimits, isLimitExceeded } from '@/lib/subscription';

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['EVENT', 'ACCOMMODATION']),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Public access: if no token, return only global categories.
    const authHeader = request.headers.get('Authorization');
    const hasToken = !!authHeader && authHeader.startsWith('Bearer ');
    const user = hasToken
      ? (await (async () => {
          const auth = await requireAuth(request, { includeVendor: true });
          if (auth.error) return null;
          return auth.user;
        })())
      : null;

    const where: any = {};
    if (type) where.type = type;
    if (!includeInactive) where.isActive = true;

    if (!user) {
      where.ownerKey = 'GLOBAL';
      return NextResponse.json(await db.category.findMany({ where, orderBy: [{ type: 'asc' }, { name: 'asc' }] }));
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(await db.category.findMany({ where, orderBy: [{ type: 'asc' }, { name: 'asc' }] }));
    }

    if (user.role === 'VENDOR' && user.vendor) {
      where.OR = [{ ownerKey: 'GLOBAL' }, { ownerKey: user.vendor.id }];
      return NextResponse.json(await db.category.findMany({ where, orderBy: [{ ownerKey: 'asc' }, { name: 'asc' }] }));
    }

    // USER
    where.ownerKey = 'GLOBAL';
    return NextResponse.json(await db.category.findMany({ where, orderBy: [{ type: 'asc' }, { name: 'asc' }] }));
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { includeVendor: true, roles: ['ADMIN', 'VENDOR'] });
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const ownerKey = user.role === 'ADMIN' ? 'GLOBAL' : user.vendor?.id;
    if (!ownerKey) return NextResponse.json({ error: 'Vendor tidak ditemukan' }, { status: 400 });

    if (user.role === 'VENDOR' && user.vendor) {
      const limits = await getVendorLimits(user.vendor.id);
      if (limits.maxCategories !== null) {
        const current = await db.category.count({ where: { ownerKey: user.vendor.id } });
        if (isLimitExceeded(current, limits.maxCategories)) {
          return NextResponse.json(
            { error: `Limit kategori tercapai. Maksimal ${limits.maxCategories} kategori untuk paket Anda.` },
            { status: 403 }
          );
        }
      }
    }

    const slug = slugify(parsed.data.name);

    const created = await db.category.create({
      data: {
        name: parsed.data.name,
        slug,
        type: parsed.data.type,
        ownerKey,
        vendorId: user.role === 'VENDOR' ? user.vendor?.id : null,
        isActive: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
