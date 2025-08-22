import { Request, Response, NextFunction } from 'express';
export interface CacheOptions {
    ttl?: number;
    keyPrefix?: string;
    skipCache?: boolean;
    varyBy?: string[];
}
export declare function cache(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare class CacheManager {
    static invalidatePattern(pattern: string): Promise<void>;
    static invalidateUserCache(userId: string): Promise<void>;
    static invalidateProjectCache(projectId: string): Promise<void>;
    static invalidateTaskCache(taskId?: string): Promise<void>;
    static clearAll(): Promise<void>;
    static getStats(): Promise<{
        keys: number;
        memory: string;
        hits: number;
        misses: number;
    }>;
}
export declare function conditionalCache(condition: (req: Request) => boolean, options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => void | Promise<void | Response<any, Record<string, any>>>;
export declare class CacheWarmer {
    static warmCommonQueries(): Promise<void>;
}
//# sourceMappingURL=cache.d.ts.map