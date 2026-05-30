import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const { id: pathId, nodeId } = await params;

    const progress = await prisma.userNodeProgress.findUnique({
      where: { userId_pathId_nodeId: { userId: payload.sub, pathId, nodeId } },
    });

    return NextResponse.json({ progress: progress || { nodeId, status: 'unlocked' } });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

const PutSchema = z.object({
  status: z.enum(['locked', 'unlocked', 'in_progress', 'completed']),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const { id: pathId, nodeId } = await params;
    const body = PutSchema.parse(await req.json());

    const now = new Date();
    const data: Record<string, unknown> = { status: body.status };
    if (body.status === 'in_progress') data.startedAt = now;
    if (body.status === 'completed') data.completedAt = now;
    if (body.notes !== undefined) data.notes = body.notes;

    const progress = await prisma.userNodeProgress.upsert({
      where: { userId_pathId_nodeId: { userId: payload.sub, pathId, nodeId } },
      update: data,
      create: { userId: payload.sub, pathId, nodeId, ...data },
    });

    // 节点标记完成 → 自动打卡
    if (body.status === 'completed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.checkIn.upsert({
        where: { userId_checkInDate: { userId: payload.sub, checkInDate: today } },
        update: { pathId, nodeId },
        create: { userId: payload.sub, checkInDate: today, pathId, nodeId },
      });
    }

    return NextResponse.json({ progress });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数错误', details: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
