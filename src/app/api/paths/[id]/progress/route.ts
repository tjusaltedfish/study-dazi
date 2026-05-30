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
    const { id: pathId } = await params;

    const records = await prisma.userNodeProgress.findMany({
      where: { userId: payload.sub, pathId },
      select: { nodeId: true, status: true, startedAt: true, completedAt: true, notes: true },
    });

    const map: Record<string, unknown> = {};
    for (const r of records) {
      map[r.nodeId] = { status: r.status, startedAt: r.startedAt, completedAt: r.completedAt, notes: r.notes };
    }

    return NextResponse.json({ progress: map });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
