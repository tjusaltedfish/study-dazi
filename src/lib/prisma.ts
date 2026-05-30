import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDbUrl() {
  const base = process.env.DATABASE_URL || '';
  // serverless 环境每个函数实例只需 1 个连接
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}connection_limit=1&pool_timeout=20`;
}

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'],
  datasourceUrl: getDbUrl(),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
