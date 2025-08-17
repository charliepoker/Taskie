import { User } from '@prisma/client';
import { LoginCredentials, RegisterData, TokenPair } from '../types';
export declare class AuthService {
    register(userData: RegisterData): Promise<{
        user: Omit<User, 'password'>;
        tokens: TokenPair;
    }>;
    login(credentials: LoginCredentials): Promise<{
        user: Omit<User, 'password'>;
        tokens: TokenPair;
    }>;
    refreshToken(refreshToken: string): Promise<TokenPair>;
    getUserById(userId: string): Promise<Omit<User, 'password'> | null>;
    updateProfile(userId: string, updateData: {
        firstName?: string;
        lastName?: string;
        avatar?: string | null;
    }): Promise<Omit<User, 'password'>>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    deleteAccount(userId: string): Promise<void>;
}
//# sourceMappingURL=authService.d.ts.map