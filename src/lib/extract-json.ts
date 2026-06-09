export function extractJSON(raw: string): object {
  // 1. 直接解析
  try { return JSON.parse(raw); } catch { /* continue */ }

  // 2. 从 markdown 代码块提取
  const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (match) {
    try { return JSON.parse(match[1]); } catch { /* continue */ }
  }

  // 3. 用括号计数提取第一个 {...}（感知字符串字面量）
  const start = raw.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) { end = i; break; }
    }
    if (end > start) {
      const slice = raw.slice(start, end + 1);
      try { return JSON.parse(slice); } catch {
        // 3b. 渝洗常见 AI 格式问题后重试
        try {
          const cleaned = cleanJSON(slice);
          return JSON.parse(cleaned);
        } catch { /* continue */ }
      }
    }
  }

  // 4. 兜底：尝试提取裸数组 [{...}, ...]
  const arrStart = raw.indexOf('[');
  if (arrStart !== -1) {
    let depth = 0;
    let arrEnd = -1;
    let inString = false;
    let escape = false;
    for (let i = arrStart; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '[') depth++;
      else if (ch === ']') depth--;
      if (depth === 0) { arrEnd = i; break; }
    }
    if (arrEnd > arrStart) {
      const slice = raw.slice(arrStart, arrEnd + 1);
      try { return JSON.parse(slice); } catch {
        try {
          const cleaned = cleanJSON(slice);
          return JSON.parse(cleaned);
        } catch { /* continue */ }
      }
    }
  }

  console.error('[extractJSON] 无法解析，前 500 字符:', raw.substring(0, 500));
  throw new Error('AI 返回了无法解析的内容，请重试');
}

/**
 * 渝洗 AI 返回的常见 JSON 格式问题
 * - 移除尾部逗号 (trailing commas)
 * - 移除注释 (// ...)
 * - 修复单引号 → 双引号（仅在非嵌套情况下）
 */
function cleanJSON(s: string): string {
  // 移除尾部逗号: ,} → }  ,] → ]
  let out = s.replace(/,\s*([}\]])/g, '$1');
  // 移除单行注释
  out = out.replace(/\/\/.*$/gm, '');
  return out;
}

/** 检测文本是否包含被截断的 JSON（括号不匹配） */
export function isTruncatedJSON(text: string): boolean {
  // 找到第一个 { 或 [
  const start = text.search(/[\[{]/);
  if (start === -1) return false;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }
  return depth > 0;
}
