const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initSocket } = require('./sockets/socketHandler');
const prisma = require('./config/prisma');

const server = http.createServer(app);

// Initialize Socket.IO on top of HTTP server
initSocket(server, env.ALLOWED_ORIGINS);

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL database via Prisma ORM.');

    server.listen(env.PORT, () => {
      console.log(`🚀 TaskDigitalCrowd API Server running on port ${env.PORT} (${env.NODE_ENV})`);
      console.log(`🌐 API Base URL: http://localhost:${env.PORT}/api/v1`);
      console.log(`🔌 Socket.IO initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

startServer();
