const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'TaskDigitalCrowd Backend API',
    company: 'Digital Crowd Technologies',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Versioned API v1 Router
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

app.use('/api/v1', v1Router);

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
