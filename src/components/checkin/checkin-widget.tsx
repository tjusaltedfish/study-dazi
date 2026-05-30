'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

interface HeatmapDay {
  date: string;
  duration: number;
}

export function CheckInWidget() {
  const token = useAuthStore((s) => s.token);
  const [streak, setStreak] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/checkins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStreak(data.streak || 0);
      setHeatmap(data.heatmap || []);

      // Check if today is in heatmap
      const today = new Date().toISOString().slice(0, 10);
      setTodayDone(data.heatmap?.some((d: HeatmapDay) => d.date === today));
    } catch { /* ignore */ }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak || 0);
        setTodayDone(true);
        loadData(); // refresh heatmap
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  // Build heatmap data for last 3 months
  const today = new Date();
  const days: { date: string; level: number }[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = heatmap.find((h) => h.date === dateStr);
    days.push({
      date: dateStr,
      level: found ? Math.min(4, Math.ceil((found.duration || 30) / 30)) : 0,
    });
  }

  const levelColors = ['bg-gray-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-700'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      {/* Check-in row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckIn}
            disabled={todayDone || loading}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              todayDone
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
            }`}
          >
            {todayDone ? '✅ 今日已打卡' : loading ? '⏳' : '📅 打卡'}
          </button>
          <div>
            <p className="text-2xl font-bold text-gray-900">{streak}</p>
            <p className="text-xs text-gray-400">连续打卡</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div>
        <p className="text-xs text-gray-400 mb-2">过去 3 个月</p>
        <div className="flex flex-wrap gap-1">
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}${d.level > 0 ? ` · ${d.level * 30}min` : ''}`}
              className={`w-3 h-3 rounded-sm ${levelColors[d.level]}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
          <span>少</span>
          {levelColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
