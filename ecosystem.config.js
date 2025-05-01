module.exports = {
  apps: [
    {
      name: 'monday-sagefx-api',
      script: 'apps/api/dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      merge_logs: true,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
} 