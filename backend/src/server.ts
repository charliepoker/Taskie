import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './utils/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Start the server first, then connect to database in background
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/api/health`
      );
      console.log(
        `🔍 Detailed health check at http://localhost:${PORT}/api/health/detailed`
      );
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ Server is ready for requests!');
    });

    // Connect to database in background (non-blocking)
    connectDatabase()
      .then(() => {
        console.log('✅ Database connected successfully');
      })
      .catch((error) => {
        console.error(
          '⚠️ Database connection failed, but server is still running:',
          error
        );
      });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
