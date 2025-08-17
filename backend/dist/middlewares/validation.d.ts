import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const validate: (schema: z.ZodSchema<any>, target?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateBody: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMultiple: (validations: Array<{
    schema: z.ZodSchema<any>;
    target: "body" | "query" | "params";
}>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (schemas: {
    body?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
    params?: z.ZodSchema<any>;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateResponse: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map