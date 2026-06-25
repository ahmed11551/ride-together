module.exports = {
  apps: [{
    name: 'ride-backend',
    script: './dist/index.js',
    cwd: '/var/www/ride-together/server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
      HOST: '0.0.0.0',
      // Задайте секреты через .env.production на сервере или PM2 env
      // JWT_SECRET=...
      // DATABASE_URL=...
      // ALLOWED_ORIGINS=https://yourdomain.com
      // TELEGRAM_BOT_TOKEN=...
      // FRONTEND_URL=https://yourdomain.com
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
  }],
};
