interface CodeEntry {
  code: string;
  passwordHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

type StoreData = Map<string, CodeEntry>;

// 使用 globalThis 确保跨 API Route 共享（Turbopack 会为每个 route 创建独立模块实例）
const globalKey = Symbol.for('study-dazi.verify-code-store');
const g = globalThis as Record<symbol, StoreData>;

function getStore(): StoreData {
  if (!g[globalKey]) {
    g[globalKey] = new Map();
  }
  return g[globalKey];
}

export class VerifyCodeStore {
  private readonly EXPIRY_MS = 10 * 60 * 1000;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_COOLDOWN_MS = 60 * 1000;

  generate(email: string, passwordHash?: string): string {
    const store = getStore();
    const existing = store.get(email);
    if (existing && Date.now() - existing.lastSentAt < this.RESEND_COOLDOWN_MS) {
      throw new Error('发送过于频繁，请 60 秒后再试');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    store.set(email, {
      code,
      passwordHash: passwordHash || existing?.passwordHash || '',
      expiresAt: Date.now() + this.EXPIRY_MS,
      attempts: existing?.attempts || 0,
      lastSentAt: Date.now(),
    });
    return code;
  }

  verify(email: string, code: string): boolean {
    const store = getStore();
    const entry = store.get(email);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      store.delete(email);
      return false;
    }
    entry.attempts++;
    if (entry.attempts > this.MAX_ATTEMPTS) {
      store.delete(email);
      return false;
    }
    if (entry.code !== code) return false;
    store.delete(email);
    return true;
  }

  getPasswordHash(email: string): string | null {
    const store = getStore();
    return store.get(email)?.passwordHash || null;
  }
}

export const verifyCodeStore = new VerifyCodeStore();
