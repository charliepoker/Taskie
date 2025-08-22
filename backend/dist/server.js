"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./utils/database");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        const server = app_1.default.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
            console.log(`🔍 Detailed health check at http://localhost:${PORT}/api/health/detailed`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('✅ Server is ready for requests!');
        });
        (0, database_1.connectDatabase)()
            .then(() => {
            console.log('✅ Database connected successfully');
        })
            .catch((error) => {
            console.error('⚠️ Database connection failed, but server is still running:', error);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map