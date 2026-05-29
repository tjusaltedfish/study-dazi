'use client';

import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Study-DaZi</h1>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.username}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
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
              <h2 className="text-xl font-semibold text-gray-900">
                欢迎回来，{user.username} 👋
              </h2>
              <p className="text-gray-500 mt-1">准备好今天的学习了吗？</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">我的路径</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">好友</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">搭子</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
              <p>更多功能即将上线 🚀</p>
              <p className="text-sm mt-1">路径规划 · 技能树 · 搭子看板</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 py-20">
            <h2 className="text-3xl font-bold text-gray-900">
              和搭子一起，系统化自学
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              AI 帮你规划学习路径，搭子陪你坚持到底。不再学杂，不再半途而废。
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                免费注册
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                登录
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
