import { Request } from 'express';
import { User } from '@prisma/client';

// Auth Types
export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Pagination Types
export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
}

export interface ValidationError extends ApiError {
  fields: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}
