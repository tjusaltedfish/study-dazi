import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDbUrl() {
  const base = process.env.DATABASE_URL || '';
  // 限制连接数，防止 serverless 环境撑爆 Supabase 连接池
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}connection_limit=3`;
}

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'],
  datasourceUrl: getDbUrl(),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
