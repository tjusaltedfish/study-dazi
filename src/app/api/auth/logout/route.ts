import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('refresh_token');
    if (!cookie?.value) {
      return NextResponse.json({ success: true });
    }

    try {
      const payload = await verifyRefreshToken(cookie.value);
      const tokens = await prisma.refreshToken.findMany({
        where: { userId: payload.sub, revoked: false },
      });

      for (const t of tokens) {
        if (await bcrypt.compare(cookie.value, t.tokenHash)) {
          await prisma.refreshToken.update({
            where: { id: t.id },
            data: { revoked: true },
          });
        }
      }
    } catch {
      // token 可能已经过期，忽略
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
