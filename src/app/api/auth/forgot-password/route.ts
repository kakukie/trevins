import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json({
        message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // In a real application, you would send an email here
    console.log(`[AUTH] Reset token for ${email}: ${token}`);

    return NextResponse.json({
      message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      ...(process.env.NODE_ENV === 'development'
        ? { debug_token: token }
        : {}),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
