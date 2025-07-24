import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// 创建Fastify实例
const fastify: FastifyInstance = Fastify({
  logger: true
})

// 声明路由
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { hello: 'world', service: 'whisper-comment-server' }
})

// 健康检查端点
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'whisper-comment-server',
    version: '1.0.0'
  }
})

// 启动服务器
const start = async (): Promise<void> => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    const host = process.env.HOST || '0.0.0.0'
    
    await fastify.listen({ port, host })
    console.log(`🚀 WhisperComment Server is running on http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...')
  await fastify.close()
  process.exit(0)
})

start()