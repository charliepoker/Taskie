"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
exports.requireAuth = requireAuth;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token is required',
                code: 'MISSING_TOKEN',
            });
            return;
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        let errorMessage = 'Invalid token';
        let errorCode = 'INVALID_TOKEN';
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                errorMessage = 'Token has expired';
                errorCode = 'TOKEN_EXPIRED';
            }
            else if (error.message.includes('Invalid')) {
                errorMessage = 'Invalid token format';
                errorCode = 'INVALID_TOKEN_FORMAT';
            }
        }
        res.status(401).json({
            success: false,
            error: errorMessage,
            code: errorCode,
        });
    }
}
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            next();
            return;
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        next();
    }
}
function requireAuth(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map