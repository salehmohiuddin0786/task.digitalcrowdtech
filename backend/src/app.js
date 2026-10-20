const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env = require('./config/env');
const prisma = require('./config/prisma');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const branchesRoutes = require('./modules/branches/branches.routes');
const teamsRoutes = require('./modules/teams/teams.routes');
const membersRoutes = require('./modules/members/members.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const tenantRoutes = require('./modules/tenants/tenants.routes');
const roleRoutes = require('./modules/roles/roles.routes');
const invitationRoutes = require('./modules/invitations/invitations.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const path = require('path');
const app = express();

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if matched in allowed origins
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded proof and evidence files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Centralized Health and System Diagnostics Handler
const healthCheckHandler = async (req, res) => {
  let dbStatus = 'connected';
  let latencyMs = 0;
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - start;
  } catch (error) {
    dbStatus = 'disconnected';
  }

  const memoryUsage = process.memoryUsage();
  const isHealthy = dbStatus === 'connected';

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'TaskDigitalCrowd Backend API',
    company: 'Digital Crowd Technologies',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    system: {
      database: {
        status: dbStatus,
        latencyMs,
      },
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    },
  };

  return res.status(isHealthy ? 200 : 503).json(payload);
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);
app.get('/api/v1/health', healthCheckHandler);

// Versioned API v1 Router with Production Rate Limiting
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/tasks', tasksRoutes);
v1Router.use('/branches', branchesRoutes);
v1Router.use('/teams', teamsRoutes);
v1Router.use('/members', membersRoutes);
v1Router.use('/notifications', notificationsRoutes);
v1Router.use('/tenants', tenantRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/invitations', invitationRoutes);
v1Router.use('/reports', reportsRoutes);

app.use('/api/v1', apiLimiter, v1Router);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
