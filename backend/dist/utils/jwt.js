"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = generateTokens;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
function generateTokens(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
    };
    const accessTokenOptions = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'taskie-api',
        audience: 'taskie-app',
    };
    const refreshTokenOptions = {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'taskie-api',
        audience: 'taskie-app',
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, accessTokenOptions);
    const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, refreshTokenOptions);
    return {
        accessToken,
        refreshToken,
    };
}
function verifyAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'taskie-api',
            audience: 'taskie-app',
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Access token has expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        else {
            throw new Error('Token verification failed');
        }
    }
}
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'taskie-api',
            audience: 'taskie-app',
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Refresh token has expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        else {
            throw new Error('Refresh token verification failed');
        }
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
//# sourceMappingURL=jwt.js.map