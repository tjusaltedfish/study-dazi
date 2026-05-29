import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

const ForgotSchema = z.object({
  email: z.string().email(),
});

// 内存存储重置 token（key: token, value: { email, expiresAt }）
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = ForgotSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      // 不暴露用户是否存在，统一返回 success
      return NextResponse.json({ success: true, message: '如果该邮箱已注册，重置链接已发送' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, {
      email: body.email,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30分钟
    });

    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(body.email, resetUrl);

    return NextResponse.json({ success: true, message: '重置链接已发送' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数错误', details: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export { resetTokens };
