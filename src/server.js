import http from 'http';
import app from './app.js';
import config from './config/environment.js';
import connectDatabase from './config/database.js';

// Connect to database
await connectDatabase();

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(config.port, () => {
  console.log(`\n🚀 Server is running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API: http://localhost:${config.port}`);
  console.log(`💚 Health check: http://localhost:${config.port}/health\n`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${config.port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${config.port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default server;
