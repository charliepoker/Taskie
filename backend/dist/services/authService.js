"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
class AuthService {
    async register(userData) {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: userData.email }, { username: userData.username }],
            },
        });
        if (existingUser) {
            if (existingUser.email === userData.email) {
                throw new Error('User with this email already exists');
            }
            if (existingUser.username === userData.username) {
                throw new Error('Username is already taken');
            }
        }
        const hashedPassword = await (0, password_1.hashPassword)(userData.password);
        const user = await prisma.user.create({
            data: {
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                password: hashedPassword,
            },
        });
        const tokens = (0, jwt_1.generateTokens)(user);
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens,
        };
    }
    async login(credentials) {
        const user = await prisma.user.findUnique({
            where: { email: credentials.email },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isPasswordValid = await (0, password_1.comparePassword)(credentials.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const tokens = (0, jwt_1.generateTokens)(user);
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens,
        };
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const tokens = (0, jwt_1.generateTokens)(user);
            return tokens;
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
        return user;
    }
    async updateProfile(userId, updateData) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
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
        return user;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isCurrentPasswordValid = await (0, password_1.comparePassword)(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        const hashedNewPassword = await (0, password_1.hashPassword)(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });
    }
    async deleteAccount(userId) {
        await prisma.user.delete({
            where: { id: userId },
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map