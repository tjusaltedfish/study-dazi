import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerifyCodeStore } from '@/lib/verify-code-store';

describe('VerifyCodeStore', () => {
  let store: VerifyCodeStore;

  beforeEach(() => {
    // 清空 globalThis 中的 store，确保测试隔离
    const key = Symbol.for('study-dazi.verify-code-store');
    (globalThis as Record<symbol, Map<unknown, unknown>>)[key] = new Map();
    store = new VerifyCodeStore();
  });

  it('generates a 6-digit code', () => {
    const code = store.generate('test@example.com');
    expect(code).toMatch(/^\d{6}$/);
  });

  it('verifies a correct code', () => {
    const code = store.generate('test@example.com');
    expect(store.verify('test@example.com', code)).toBe(true);
  });

  it('rejects an incorrect code', () => {
    store.generate('test@example.com');
    expect(store.verify('test@example.com', '000000')).toBe(false);
  });

  it('rejects after 5 failed attempts', () => {
    const code = store.generate('test@example.com');
    for (let i = 0; i < 5; i++) {
      store.verify('test@example.com', '000000');
    }
    expect(store.verify('test@example.com', code)).toBe(false);
  });

  it('expires after 10 minutes', () => {
    vi.useFakeTimers();
    const code = store.generate('test@example.com');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(store.verify('test@example.com', code)).toBe(false);
    vi.useRealTimers();
  });

  it('enforces 60-second resend cooldown', () => {
    store.generate('test@example.com');
    expect(() => store.generate('test@example.com')).toThrow(/60.*秒/);
  });

  it('stores and retrieves password hash', () => {
    store.generate('hash@test.com', 'hashed_password_123');
    expect(store.getPasswordHash('hash@test.com')).toBe('hashed_password_123');
  });
});
