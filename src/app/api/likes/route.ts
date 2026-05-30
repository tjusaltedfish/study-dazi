import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/likes — 获取我的收藏
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const payload = await verifyAccessToken(auth);
    const likes = await prisma.like.findMany({ where: { userId: payload.sub } });
    return NextResponse.json({ likes });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST /api/likes — 点赞
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const payload = await verifyAccessToken(auth);
    const { postId, resourceId } = await req.json();
    
    if (postId) {
      await prisma.like.create({ data: { userId: payload.sub, postId } });
    } else if (resourceId) {
      await prisma.like.create({ data: { userId: payload.sub, resourceId } });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '点赞失败' }, { status: 500 });
  }
}

// DELETE /api/likes — 取消点赞
export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const payload = await verifyAccessToken(auth);
    const { postId, resourceId } = await req.json();
    
    if (postId) {
      await prisma.like.deleteMany({ where: { userId: payload.sub, postId } });
    } else if (resourceId) {
      await prisma.like.deleteMany({ where: { userId: payload.sub, resourceId } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '取消点赞失败' }, { status: 500 });
  }
}
