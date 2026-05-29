'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // 登录后检查是否有 API Key
  useEffect(() => {
    if (user) {
      checkApiKey();
    }
  }, [user]);

  const checkApiKey = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.deepseekApiKey) {
          setShowKeyModal(true);
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Study-DaZi</h1>
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/paths/new" className="text-sm text-indigo-600 hover:text-indigo-500">
                生成路径
              </Link>
              <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700">
                设置
              </Link>
              <span className="text-sm text-gray-600">{user.username}</span>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
                退出
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
              登录
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {user ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900">欢迎回来，{user.username} 👋</h2>
              <p className="text-gray-500 mt-1">准备好今天的学习了吗？</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/paths/new" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500">我的路径</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">新建</p>
              </Link>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">好友</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">搭子</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 py-20">
            <h2 className="text-3xl font-bold text-gray-900">和搭子一起，系统化自学</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              AI 帮你规划学习路径，搭子陪你坚持到底。不再学杂，不再半途而废。
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/register" className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                免费注册
              </Link>
              <Link href="/login" className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                登录
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">🔑 配置 API Key</h3>
            <p className="text-sm text-gray-600">
              使用 AI 生成学习路径需要 DeepSeek API Key。在 <a href="https://platform.deepseek.com" target="_blank" className="text-indigo-600 underline">platform.deepseek.com</a> 免费注册获取。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                稍后
              </button>
              <Link
                href="/settings"
                onClick={() => setShowKeyModal(false)}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white text-center hover:bg-indigo-500"
              >
                去设置
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
