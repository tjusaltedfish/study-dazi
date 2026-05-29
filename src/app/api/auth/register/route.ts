import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyCodeStore } from '@/lib/verify-code-store';
import { sendVerificationCode } from '@/lib/email';

const RegisterSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码需包含至少一个字母')
    .regex(/[0-9]/, '密码需包含至少一个数字'),
});

export async function POST(req: NextRequest) {
  try {
    const body = RegisterSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing?.emailVerified) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const code = verifyCodeStore.generate(body.email, passwordHash);
    await sendVerificationCode(body.email, code);

    const isDev = !process.env.RESEND_API_KEY;

    return NextResponse.json({
      success: true,
      message: isDev
        ? `验证码：${code}（开发模式，验证码直接显示）`
        : `验证码已发送至 ${body.email}`,
      code: isDev ? code : undefined,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数校验失败', details: err.issues }, { status: 422 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
