import express from 'express';
import cors from 'cors';
import config from './config/environment.js';
import errorHandler from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Class Scheduler API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.path
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
