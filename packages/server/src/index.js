import Fastify from 'fastify'

const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler (request, reply) {
  return { hello: 'world' }
})

// Health check endpoint
fastify.get('/health', async function handler (request, reply) {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server is running on http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()