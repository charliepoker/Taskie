import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './utils/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database connections
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/health`
      );
      console.log(
        `🔍 Detailed health check at http://localhost:${PORT}/health/detailed`
      );
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
