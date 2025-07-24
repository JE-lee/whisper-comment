import { PrismaClient } from '@prisma/client'

// 创建全局的 Prisma 客户端实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在开发环境中重用连接，在生产环境中创建新连接
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// 在开发环境中将 prisma 实例保存到全局变量，避免热重载时创建多个连接
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})