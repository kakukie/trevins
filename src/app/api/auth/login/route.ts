import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken } from '@/lib/jwt';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
  captcha: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Input tidak valid', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    // SaaS subscription check for vendor accounts
    if (user.role === 'VENDOR') {
      const vendor = await db.vendor.findUnique({
        where: { userId: user.id },
        select: { isActive: true, subscriptionStatus: true },
      });
      if (!vendor || !vendor.isActive || vendor.subscriptionStatus !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Akun vendor tidak aktif (subscription nonaktif)' },
          { status: 403 }
        );
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login berhasil'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
