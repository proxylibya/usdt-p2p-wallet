# Railway Environment Variables

## Required Variables (Must Set)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | JWT signing secret (min 64 chars) | Generate with: `openssl rand -base64 64` |
| `ENCRYPTION_KEY` | Data encryption key (32 chars) | Generate with: `openssl rand -hex 16` |

## Optional Variables (With Defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Server port (Railway sets automatically) |
| `NODE_ENV` | `production` | Environment mode |
| `REDIS_ENABLED` | `true` | Enable Redis (set `false` if no Redis) |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | - | Redis password |
| `JWT_ACCESS_EXPIRATION` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token expiry |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `GEMINI_API_KEY` | - | Google AI API key (for AI features) |

## Railway Setup Instructions

### 1. Add PostgreSQL Database
```
Railway Dashboard > New > Database > PostgreSQL
```
Railway will automatically set `DATABASE_URL`.

### 2. Add Redis (Optional but Recommended)
```
Railway Dashboard > New > Database > Redis
```
Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` from Redis service.

### 3. Set Required Variables
In Railway service settings > Variables:
```
JWT_SECRET=<your-64-char-secret>
ENCRYPTION_KEY=<your-32-char-key>
NODE_ENV=production
```

### 4. Verify Deployment
After deployment, check:
- Build logs for errors
- Health endpoint: `https://your-app.railway.app/api/v1`
- API docs (dev only): `https://your-app.railway.app/docs`

## Troubleshooting

### Health Check Failing
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL service is running
- Ensure migrations ran successfully

### Database Connection Errors
- Verify SSL mode in connection string: `?sslmode=require`
- Check PostgreSQL service status in Railway

### Build Errors
- Verify Node.js 20 is being used
- Check `nixpacks.toml` configuration
