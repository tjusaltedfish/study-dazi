import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyCodeStore } from '@/lib/verify-code-store';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

const VerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, '验证码为 6 位数字'),
});

export async function POST(req: NextRequest) {
  try {
    const body = VerifySchema.parse(await req.json());

    // 先取密码哈希，再校验验证码（校验成功会删除 Map 条目）
    const passwordHash = verifyCodeStore.getPasswordHash(body.email);
    if (!passwordHash) {
      return NextResponse.json({ error: '请先注册再验证' }, { status: 400 });
    }

    if (!verifyCodeStore.verify(body.email, body.code)) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    const username = body.email.split('@')[0];

    const user = await prisma.user.upsert({
      where: { email: body.email },
      update: { emailVerified: true, passwordHash },
      create: { username, email: body.email, passwordHash, emailVerified: true },
    });

    const accessToken = await signAccessToken({
      sub: user.id, email: user.email, emailVerified: true,
    });

    const refreshToken = await signRefreshToken({ sub: user.id });
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = NextResponse.json({
      token: accessToken,
      user: { id: user.id, username: user.username, email: user.email, emailVerified: true },
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数校验失败', details: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
