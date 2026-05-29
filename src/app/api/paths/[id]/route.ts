import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const { id } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id } });
    if (!path) return NextResponse.json({ error: '路径不存在' }, { status: 404 });
    if (path.userId !== payload.sub) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const { id } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id } });
    if (!path) return NextResponse.json({ error: '路径不存在' }, { status: 404 });
    if (path.userId !== payload.sub) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    await prisma.learningPath.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
