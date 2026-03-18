import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

type AuthRole = 'ADMIN' | 'VENDOR' | 'USER';

type AuthUser = User & {
  vendor?: {
    id: string;
    userId: string;
    businessName: string;
    isActive?: boolean;
    subscriptionStatus?: string;
  } | null;
};

interface RequireAuthOptions {
  includeVendor?: boolean;
  roles?: AuthRole[];
}

interface RequireAuthResult {
  user: AuthUser | null;
  error: NextResponse | null;
}

export async function requireAuth(
  request: Request,
  options: RequireAuthOptions = {}
): Promise<RequireAuthResult> {
  const { includeVendor = false, roles } = options;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload?.userId) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Token tidak valid' }, { status: 401 }),
    };
  }

  const user = (await db.user.findUnique({
    where: { id: payload.userId },
    include: includeVendor ? { vendor: true } : undefined,
  })) as AuthUser | null;

  if (!user || !user.isActive) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Vendor subscription enforcement (SaaS)
  if ((user.role as AuthRole) === 'VENDOR') {
    const vendor =
      includeVendor
        ? user.vendor
        : await db.vendor.findUnique({
            where: { userId: user.id },
            select: { id: true, isActive: true, subscriptionStatus: true },
          });

    if (!vendor || !vendor.isActive || vendor.subscriptionStatus !== 'ACTIVE') {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Akun vendor Anda tidak aktif (subscription nonaktif)' },
          { status: 403 }
        ),
      };
    }
  }

  if (roles && !roles.includes(user.role as AuthRole)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
