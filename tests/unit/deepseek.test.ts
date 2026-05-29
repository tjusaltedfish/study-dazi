import { describe, it, expect } from 'vitest';
import { extractJSON } from '@/lib/extract-json';

describe('extractJSON', () => {
  it('parses plain JSON', () => {
    expect(extractJSON('{"a":1}')).toEqual({ a: 1 });
  });

  it('extracts from markdown code block', () => {
    const input = '```json\n{"b":2}\n```';
    expect(extractJSON(input)).toEqual({ b: 2 });
  });

  it('extracts from mixed text', () => {
    const input = '这是结果：\n{"c":3}\n希望对你有帮助';
    expect(extractJSON(input)).toEqual({ c: 3 });
  });

  it('throws on garbage', () => {
    expect(() => extractJSON('not json at all')).toThrow();
  });
});
