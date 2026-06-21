module.exports = {
  apps: [{
    name: 'ig-auto-dm',
    script: 'src/automation/bot.cjs',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
