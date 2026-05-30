-- ============================================
-- Study-DaZi 数据库迁移
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 1. 用户表扩展（头像 + 简介）
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. 动态表
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- 3. 打卡表
CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id TEXT,
  node_id TEXT,
  check_in_date DATE NOT NULL,
  duration_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON check_ins(user_id, check_in_date);

-- 4. 节点进度表
CREATE TABLE IF NOT EXISTS user_node_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, path_id, node_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user_path ON user_node_progress(user_id, path_id);
