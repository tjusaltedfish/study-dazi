import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { resetTokens } from '@/app/api/auth/forgot-password/route';

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码需包含至少一个字母')
    .regex(/[0-9]/, '密码需包含至少一个数字'),
});

export async function POST(req: NextRequest) {
  try {
    const body = ResetSchema.parse(await req.json());

    const entry = resetTokens.get(body.token);
    if (!entry || Date.now() > entry.expiresAt) {
      resetTokens.delete(body.token);
      return NextResponse.json({ error: '重置链接已过期，请重新申请' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.user.update({
      where: { email: entry.email },
      data: { passwordHash },
    });

    // 作废所有 refresh token
    await prisma.refreshToken.updateMany({
      where: { user: { email: entry.email }, revoked: false },
      data: { revoked: true },
    });

    resetTokens.delete(body.token);

    return NextResponse.json({ success: true, message: '密码已重置，请重新登录' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数错误', details: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
