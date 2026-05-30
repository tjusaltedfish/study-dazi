import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// POST /api/checkins — 今日打卡
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 今日已打卡则返回已有记录
    const existing = await prisma.checkIn.findUnique({
      where: { userId_checkInDate: { userId: payload.sub, checkInDate: today } },
    });
    if (existing) {
      return NextResponse.json({ checkIn: existing, streak: await getStreak(payload.sub) });
    }

    const checkIn = await prisma.checkIn.create({
      data: { userId: payload.sub, checkInDate: today },
    });

    const streak = await getStreak(payload.sub);
    return NextResponse.json({ checkIn, streak }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// GET /api/checkins?year=2025 — 热力图数据 + 连续天数
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const year = parseInt(req.nextUrl.searchParams.get('year') || String(new Date().getFullYear()));

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const records = await prisma.checkIn.findMany({
      where: { userId: payload.sub, checkInDate: { gte: start, lt: end } },
      select: { checkInDate: true, durationMin: true },
      orderBy: { checkInDate: 'asc' },
    });

    const streak = await getStreak(payload.sub);

    return NextResponse.json({
      streak,
      heatmap: records.map((r) => ({
        date: r.checkInDate.toISOString().slice(0, 10),
        duration: r.durationMin || 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

async function getStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const d = new Date(today);

  // 检查今天是否打卡
  const todayRecord = await prisma.checkIn.findUnique({
    where: { userId_checkInDate: { userId, checkInDate: today } },
  });

  if (!todayRecord) {
    // 今天没打卡，检查昨天（连续可能断在今天）
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const record = await prisma.checkIn.findUnique({
      where: { userId_checkInDate: { userId, checkInDate: d } },
    });
    if (!record) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}
