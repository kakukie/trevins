import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['USER', 'VENDOR']).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data registrasi tidak valid', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role = 'USER' } = parsed.data;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password harus diisi' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
      },
    });

    // If registering as vendor, create vendor profile
    if (role === 'VENDOR') {
      await db.vendor.create({
        data: {
          userId: user.id,
          businessName: name,
        },
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Registrasi berhasil'
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
