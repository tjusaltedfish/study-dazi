export function extractJSON(raw: string): object {
  try { return JSON.parse(raw); } catch { /* continue */ }

  const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (match) {
    try { return JSON.parse(match[1]); } catch { /* continue */ }
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch { /* continue */ }
  }

  throw new Error('AI 返回了无法解析的内容，请重试');
}
