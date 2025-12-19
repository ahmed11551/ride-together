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
      // JWT_SECRET должен быть установлен здесь или через .env.production
      // Генерация: openssl rand -base64 32
      JWT_SECRET: 'lUj1cLWZ0+Lskxda8ZTwqTxXKDk9GVcGIrw7K+UDclc=',
      DATABASE_URL: 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full',
      ALLOWED_ORIGINS: 'http://194.67.124.123,https://194.67.124.123,https://ridetogether.ru,https://www.ridetogether.ru,https://api.ridetogether.ru',
      TELEGRAM_BOT_TOKEN: '8346758333:AAFJgFLdLHe4wSRWjZReGFYvwNsOOWYScyY',
      FRONTEND_URL: 'https://ridetogether.ru'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

