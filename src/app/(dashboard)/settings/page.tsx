'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSave = async () => {
    setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deepseekApiKey: apiKey }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">设置</h1>
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700">
            返回首页
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">DeepSeek API Key</h2>
            <p className="text-sm text-gray-500 mt-1">
              用于 AI 生成学习路径。在 <a href="https://platform.deepseek.com" target="_blank" className="text-indigo-600 underline">platform.deepseek.com</a> 获取 Key。
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>
          )}
          {saved && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">已保存</div>
          )}

          <div>
            <label htmlFor="apikey" className="block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              id="apikey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </main>
    </div>
  );
}
