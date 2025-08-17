import { User } from '@prisma/client';
import { TokenPair } from '../types';
export interface JwtPayload {
    userId: string;
    email: string;
    username: string;
}
export declare function generateTokens(user: User): TokenPair;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): JwtPayload;
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
//# sourceMappingURL=jwt.d.ts.map