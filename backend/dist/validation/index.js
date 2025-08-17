"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateRangeSchema = exports.searchSchema = exports.paginationSchema = exports.uuidParamSchema = void 0;
__exportStar(require("./auth"), exports);
__exportStar(require("./project"), exports);
__exportStar(require("./task"), exports);
__exportStar(require("./comment"), exports);
__exportStar(require("./responses"), exports);
const zod_1 = require("zod");
exports.uuidParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('ID must be a valid UUID'),
});
const createPaginationField = (defaultValue, max = 100) => zod_1.z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : defaultValue))
    .refine((val) => val > 0 && val <= max, `Must be between 1 and ${max}`)
    .refine((val) => Number.isInteger(val), 'Must be an integer');
exports.paginationSchema = zod_1.z.object({
    page: createPaginationField(1, 1000),
    limit: createPaginationField(10, 100),
});
exports.searchSchema = zod_1.z.object({
    search: zod_1.z
        .string()
        .max(100, 'Search term must be less than 100 characters')
        .optional(),
});
exports.dateRangeSchema = zod_1.z
    .object({
    startDate: zod_1.z
        .string()
        .datetime('Start date must be a valid ISO datetime')
        .transform((str) => new Date(str))
        .optional(),
    endDate: zod_1.z
        .string()
        .datetime('End date must be a valid ISO datetime')
        .transform((str) => new Date(str))
        .optional(),
})
    .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
});
//# sourceMappingURL=index.js.map