// Environment configuration
// Digital Crowd Technologies
require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5100', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/taskdigitalcrowd_db',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'taskdigitalcrowd_jwt_access_super_secret_key_2026',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'taskdigitalcrowd_jwt_refresh_super_secret_key_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:4100',
  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:4100,http://127.0.0.1:4100,http://localhost:3000,http://127.0.0.1:3000,https://tasks.digitalcrowdtech.in,https://api-tasks.digitalcrowdtech.in,https://digitalcrowdtech.in'
  ).split(','),
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
};

module.exports = env;
