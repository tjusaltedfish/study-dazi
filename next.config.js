/** @type {import('next').NextConfig} */
const nextConfig = {
  // 部署到新加坡（和 Supabase 同区域，减少延迟）
  // Vercel 免费版默认在美东，到 Supabase 新加坡延迟 300-500ms
  // 切到 sin1 后延迟 < 10ms
};

module.exports = nextConfig;
