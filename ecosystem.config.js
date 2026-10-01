module.exports = {
  apps: [
    {
      name: 'asf-servidor',
      script: 'dist/server.js',
      cwd: '/home/centagrui/MONITOREO-ASF-WEB/servidor',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      },
      restart_delay: 3000,
      max_restarts: 10,
      watch: false
    },
    {
      name: 'asf-cliente',
      script: 'node_modules/.bin/vite',
      args: '--host',
      cwd: '/home/centagrui/MONITOREO-ASF-WEB/cliente',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      },
      restart_delay: 3000,
      max_restarts: 10,
      watch: false
    }
  ]
};
