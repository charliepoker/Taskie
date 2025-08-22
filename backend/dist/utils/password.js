"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.validatePasswordStrength = validatePasswordStrength;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    try {
        const salt = await bcryptjs_1.default.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        return hashedPassword;
    }
    catch (error) {
        throw new Error('Failed to hash password');
    }
}
async function comparePassword(password, hashedPassword) {
    try {
        const isMatch = await bcryptjs_1.default.compare(password, hashedPassword);
        return isMatch;
    }
    catch (error) {
        throw new Error('Failed to compare password');
    }
}
function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password should contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=password.js.map