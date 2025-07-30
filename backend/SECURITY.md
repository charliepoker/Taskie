# Security Implementation Guide

This document outlines the security measures implemented in the Taskie backend application.

## Overview

The application implements multiple layers of security hardening to protect against common web vulnerabilities and attacks.

## Security Features Implemented

### 1. Rate Limiting

**Purpose**: Prevent abuse and DoS attacks by limiting the number of requests per time window.

**Implementation**:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Sensitive operations**: 10 requests per 15 minutes

**Configuration**:

```typescript
// Located in src/config/security.ts
rateLimits: {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 15 * 60 * 1000, max: 100 },
  strict: { windowMs: 15 * 60 * 1000, max: 10 }
}
```

**Applied to**:

- `/api/auth/login` - Auth rate limit
- `/api/auth/register` - Auth rate limit
- `/api/auth/refresh-token` - Strict rate limit
- `/api/auth/change-password` - Strict rate limit
- All DELETE operations - Strict rate limit
- All other API endpoints - General API rate limit

### 2. CORS Configuration

**Purpose**: Control cross-origin requests and prevent unauthorized access from other domains.

**Implementation**:

- Whitelist of allowed origins
- Specific allowed methods and headers
- Credentials support for authenticated requests
- Preflight request caching

**Configuration**:

```typescript
cors: {
  allowedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}
```

### 3. Security Headers

**Purpose**: Implement browser security policies and prevent various client-side attacks.

**Headers Applied**:

- **Content-Security-Policy**: Restricts resource loading to prevent XSS
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts access to browser features

**CSP Configuration**:

```typescript
csp: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "https:"],
    connectSrc: ["'self'", "https:"],
    frameAncestors: ["'none'"]
  }
}
```

### 4. Input Sanitization

**Purpose**: Remove potentially malicious content from user input to prevent XSS attacks.

**Patterns Removed**:

- `<script>` tags and content
- `<iframe>` tags and content
- `javascript:` protocol URLs
- Event handler attributes (`onclick`, `onload`, etc.)

**Implementation**:

- Applied to all request bodies and query parameters
- Recursive sanitization for nested objects and arrays
- Preserves legitimate content while removing threats

### 5. SQL Injection Protection

**Purpose**: Detect and block SQL injection attempts in user input.

**Detection Patterns**:

- SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- SQL comment patterns (`--`, `/*`, `*/`)
- SQL operators and comparison patterns
- Database metadata table names

**Implementation**:

- Scans all string inputs in request body and query parameters
- Blocks requests containing suspicious patterns
- Logs all blocked attempts for security monitoring
- Works alongside Prisma ORM's built-in protection

### 6. Request Size Limiting

**Purpose**: Prevent resource exhaustion attacks through oversized requests.

**Limits**:

- JSON payload: 10MB maximum
- URL-encoded data: 10MB maximum
- Parameter count: 1000 maximum

**Implementation**:

- Checks Content-Length header before processing
- Rejects requests exceeding size limits
- Logs oversized request attempts

### 7. Security Audit Logging

**Purpose**: Track security-relevant events for monitoring and incident response.

**Logged Events**:

- Authentication attempts (success/failure)
- Rate limit violations
- SQL injection attempts
- Unauthorized access attempts
- Sensitive operations (CREATE, UPDATE, DELETE)

**Log Format**:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "warn",
  "message": "SQL injection attempt detected",
  "service": "security-audit",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "path": "/api/users",
  "method": "POST",
  "userId": "user-id-if-authenticated"
}
```

**Log Storage**:

- File: `logs/security-audit.log`
- Rotation: 10MB max size, 5 files retained
- Console output in development

### 8. IP Filtering (Optional)

**Purpose**: Allow/block specific IP addresses for additional access control.

**Configuration**:

```typescript
// Environment variables
IP_WHITELIST=192.168.1.0/24,10.0.0.0/8
IP_BLACKLIST=192.168.1.100,10.0.0.50
```

**Implementation**:

- Whitelist takes precedence over blacklist
- Supports individual IPs and CIDR ranges
- Logs blocked access attempts

## Security Middleware Stack

The security middleware is applied in the following order:

1. **Trust Proxy** - For accurate IP detection behind load balancers
2. **Helmet** - Basic security headers
3. **Custom Security Headers** - Enhanced CSP and security policies
4. **CORS** - Cross-origin request filtering
5. **Security Audit Logging** - Event tracking
6. **Request Size Limiting** - Payload size validation
7. **SQL Injection Protection** - Malicious query detection
8. **Input Sanitization** - XSS prevention
9. **Rate Limiting** - Request throttling
10. **Route-specific middleware** - Authentication, validation, etc.

## Configuration

All security settings are centralized in `src/config/security.ts` and can be customized through environment variables:

```bash
# CORS settings
FRONTEND_URL=https://yourdomain.com

# IP filtering
IP_WHITELIST=192.168.1.0/24
IP_BLACKLIST=192.168.1.100

# Rate limiting (optional overrides)
AUTH_RATE_LIMIT_MAX=5
API_RATE_LIMIT_MAX=100
STRICT_RATE_LIMIT_MAX=10
```

## Testing

Security middleware can be tested using the provided test suite:

```bash
# Run security-specific tests
npm test -- --testPathPattern=security.test.ts

# Run basic security validation
node test-security.js
```

## Monitoring and Alerts

### Log Monitoring

Monitor the security audit log for:

- Repeated failed authentication attempts
- SQL injection attempts
- Rate limit violations
- Unusual access patterns

### Recommended Alerts

Set up alerts for:

- More than 10 failed login attempts from same IP in 1 hour
- Any SQL injection attempts
- Rate limit violations exceeding 100 per hour
- Requests from blacklisted IPs

### Metrics to Track

- Authentication success/failure rates
- Rate limit hit rates by endpoint
- Geographic distribution of requests
- User agent patterns for bot detection

## Best Practices

1. **Regular Updates**: Keep security dependencies updated
2. **Log Review**: Regularly review security audit logs
3. **Rate Limit Tuning**: Adjust limits based on legitimate usage patterns
4. **CSP Refinement**: Gradually tighten CSP policies as application matures
5. **IP Filtering**: Use IP filtering sparingly to avoid blocking legitimate users
6. **Monitoring**: Implement real-time monitoring and alerting
7. **Incident Response**: Have procedures for responding to security events

## Security Headers Verification

You can verify security headers are properly set using online tools:

- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## Compliance

This implementation helps meet requirements for:

- OWASP Top 10 protection
- SOC 2 security controls
- GDPR data protection requirements
- PCI DSS (if handling payment data)

## Incident Response

In case of security incidents:

1. **Immediate**: Check security audit logs for attack patterns
2. **Analysis**: Identify affected endpoints and user accounts
3. **Mitigation**: Temporarily tighten rate limits or block IPs if needed
4. **Recovery**: Reset compromised credentials and review access logs
5. **Prevention**: Update security rules based on attack patterns

## Additional Recommendations

For production deployment, consider:

- Web Application Firewall (WAF)
- DDoS protection service
- SSL/TLS certificate monitoring
- Vulnerability scanning
- Penetration testing
- Security code reviews
