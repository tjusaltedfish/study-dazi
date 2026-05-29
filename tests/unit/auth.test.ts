import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth';

const TEST_USER = {
  sub: 'user-123',
  email: 'test@example.com',
  emailVerified: true,
};

describe('auth JWT utilities', () => {
  it('signs and verifies an access token', async () => {
    const token = await signAccessToken(TEST_USER);
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('test@example.com');
    expect(payload.emailVerified).toBe(true);
  });

  it('signs and verifies a refresh token', async () => {
    const token = await signRefreshToken({ sub: 'user-123' });
    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('throws on tampered access token', async () => {
    const token = await signAccessToken(TEST_USER);
    await expect(verifyAccessToken(token + 'x')).rejects.toThrow();
  });

  it('throws on tampered refresh token', async () => {
    const token = await signRefreshToken({ sub: 'user-123' });
    await expect(verifyRefreshToken(token + 'x')).rejects.toThrow();
  });
});
