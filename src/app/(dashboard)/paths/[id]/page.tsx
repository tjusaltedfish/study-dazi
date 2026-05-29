'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';

interface TreeNode {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  node_type: 'required' | 'optional' | 'advanced';
  resources_hint: string;
  check_criteria: string;
}

interface Phase {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  is_required: boolean;
  why: string;
  children?: TreeNode[];
}

interface PathData {
  id: string;
  title: string;
  domain: string;
  treeData: {
    domain: string;
    level: string;
    phases: Phase[];
  };
  createdAt: string;
}

export default function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [path, setPath] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && id) {
      loadPath();
    }
  }, [token, id]);

  const loadPath = async () => {
    try {
      const res = await fetch(`/api/paths/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '加载失败');
      }
      const data = await res.json();
      setPath(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>
          <button onClick={() => router.push('/')} className="mt-4 text-sm text-indigo-600 hover:text-indigo-500">
            ← 返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!path) return null;

  const phases = path.treeData?.phases || [];
  const totalHours = phases.reduce((sum, p) => sum + (p.estimated_hours || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{path.title}</h1>
            <p className="text-xs text-gray-400">{path.domain} · {new Date(path.createdAt).toLocaleDateString('zh-CN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">总计 ~{totalHours}h</span>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              返回
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      phase.is_required ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {phase.is_required ? '必修' : '可选'}
                    </span>
                    <h3 className="font-semibold text-gray-900">{phase.title}</h3>
                    <span className="text-xs text-gray-400">~{phase.estimated_hours}h</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{phase.why}</p>

                  {/* 子节点 */}
                  {phase.children && phase.children.length > 0 && (
                    <div className="mt-3 ml-4 border-l-2 border-indigo-100 pl-4 space-y-2">
                      {phase.children.map((node) => (
                        <div key={node.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              node.node_type === 'required' ? 'bg-indigo-50 text-indigo-600' :
                              node.node_type === 'optional' ? 'bg-amber-50 text-amber-600' :
                              'bg-purple-50 text-purple-600'
                            }`}>
                              {node.node_type === 'required' ? '必修' : node.node_type === 'optional' ? '可选' : '进阶'}
                            </span>
                            <span className="font-medium">{node.title}</span>
                            <span className="text-gray-400">~{node.estimated_hours}h</span>
                          </div>
                          <p className="text-gray-500 mt-0.5">{node.description}</p>
                          <p className="text-gray-400 text-xs mt-0.5">✅ {node.check_criteria}</p>
                          {node.resources_hint && (
                            <p className="text-indigo-500 text-xs mt-0.5">📚 {node.resources_hint}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {phases.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>该路径没有内容</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
