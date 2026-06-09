import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { getProviderConfig } from '@/lib/ai-providers';

const BodySchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ ok: false, error: '请先登录' }, { status: 401 });

    const payload = await verifyAccessToken(auth);
    const body = BodySchema.parse(await req.json());

    const config = getProviderConfig(body.provider, body.baseUrl);

    // 获取 API Key：优先用传入的，否则从 DB 查
    let apiKey = body.apiKey;
    if (!apiKey) {
      const saved = await prisma.userApiKey.findUnique({
        where: { userId_provider: { userId: payload.sub, provider: body.provider } },
      });
      if (!saved) {
        return NextResponse.json({ ok: false, error: '未配置 API Key' }, { status: 400 });
      }
      apiKey = saved.apiKey;
    }

    const url = `${config.baseUrl}/chat/completions`;

    // 发一个最简单的测试请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = `API 返回 ${res.status}`;
        try {
          const err = JSON.parse(text);
          msg = err.error?.message || err.message || msg;
        } catch {
          if (text) msg = `${msg}: ${text.slice(0, 200)}`;
        }
        return NextResponse.json({ ok: false, error: msg, url });
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '(空响应)';
      return NextResponse.json({ ok: true, reply, url });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : '连接失败';
      return NextResponse.json({ ok: false, error: msg, url });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: '参数错误' }, { status: 422 });
    }
    console.error('[AI Test] Error:', err);
    return NextResponse.json({ ok: false, error: '服务器错误' }, { status: 500 });
  }
}
