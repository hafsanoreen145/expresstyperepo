/**
 * Express Server Configuration
 * Main application entry point with middleware and routing setup
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { CONFIG, MESSAGES } from './constants';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = CONFIG.PORT;
const prisma = new PrismaClient();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS Configuration
if (CONFIG.ENABLE_CORS) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });
}

// ============================================================================
// HEALTH CHECK & ROOT ENDPOINT
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: MESSAGES.SERVER_RUNNING,
    environment: CONFIG.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Express.js OAuth LinkedIn API',
    documentation: {
      baseUrl: `${CONFIG.APP_URL}${CONFIG.API_PREFIX}`,
      endpoints: {
        auth: {
          initiate: `GET ${CONFIG.API_PREFIX}/auth/linkedin/start`,
          callback: `GET ${CONFIG.API_PREFIX}/auth/linkedin/callback`,
          exchangeSession: `POST ${CONFIG.API_PREFIX}/auth/session/exchange`,
          getCurrentUser: `GET ${CONFIG.API_PREFIX}/auth/me`,
          logout: `POST ${CONFIG.API_PREFIX}/auth/logout`,
        },
        health: 'GET /health',
      },
    },
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use(`${CONFIG.API_PREFIX}`, apiRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Not Found handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ⚡ Express.js OAuth LinkedIn API                        ║
║                                                            ║
║   🚀 Server running at http://localhost:${port}              ║
║   🌍 Environment: ${CONFIG.NODE_ENV}                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('✓ HTTP server closed');
    await prisma.$disconnect();
    console.log('✓ Database connection closed');
    console.log('✓ Application terminated');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Force shutting down...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;

