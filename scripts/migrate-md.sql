-- 追加：Post 表新增 markdown 字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS markdown TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS markdown_html TEXT;
