# Security Guidelines

## Environment Variables and Secrets Management

### Development Setup

1. **Copy environment files:**

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. **Generate secure JWT secrets:**

   ```bash
   # Generate JWT_SECRET
   openssl rand -hex 32

   # Generate JWT_REFRESH_SECRET
   openssl rand -hex 32
   ```

3. **Update .env files with generated secrets**

### Important Security Notes

- **Never commit .env files** to version control
- **Use strong, randomly generated secrets** for JWT tokens (minimum 32 characters)
- **Change default database passwords** in production
- **Use environment-specific configurations** for different deployment stages

### Production Deployment

For production deployments:

1. **Use a secure secret management system** (AWS Secrets Manager, Azure Key Vault, etc.)
2. **Generate new, unique secrets** for each environment
3. **Enable SSL/TLS** for all database connections
4. **Use strong database passwords** (minimum 16 characters with mixed case, numbers, and symbols)
5. **Regularly rotate secrets** and credentials
6. **Enable database authentication** and access controls
7. **Use Redis AUTH** if Redis is exposed to networks

### Environment Variables Reference

| Variable              | Description              | Example                       | Required |
| --------------------- | ------------------------ | ----------------------------- | -------- |
| `POSTGRES_DB`         | Database name            | `taskietaskie`                | Yes      |
| `POSTGRES_USER`       | Database username        | `postgres`                    | Yes      |
| `POSTGRES_PASSWORD`   | Database password        | `secure_password_123`         | Yes      |
| `JWT_SECRET`          | JWT signing secret       | `32+ character random string` | Yes      |
| `JWT_REFRESH_SECRET`  | JWT refresh token secret | `32+ character random string` | Yes      |
| `NODE_ENV`            | Application environment  | `development/production`      | Yes      |
| `PORT`                | Application port         | `5000`                        | No       |
| `FRONTEND_URL`        | Frontend application URL | `http://localhost:3000`       | Yes      |
| `NEXT_PUBLIC_API_URL` | API URL for frontend     | `http://localhost:5000`       | Yes      |

### Secret Generation Commands

```bash
# Generate a 32-byte hex secret
openssl rand -hex 32

# Generate a 64-byte hex secret
openssl rand -hex 64

# Generate a base64 secret
openssl rand -base64 32

# Generate using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Checking for Exposed Secrets

Before committing code:

1. **Run GitGuardian or similar tools** to scan for exposed secrets
2. **Review all configuration files** for hardcoded credentials
3. **Use git hooks** to prevent accidental secret commits
4. **Regularly audit** environment configurations

### If Secrets Are Exposed

If secrets are accidentally committed:

1. **Immediately rotate all exposed secrets**
2. **Update all environments** with new secrets
3. **Remove secrets from git history** using tools like BFG Repo-Cleaner
4. **Notify team members** about the security incident
5. **Review and improve** secret management processes
