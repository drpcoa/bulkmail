# Bulkmail Deployment Guide

This guide provides detailed instructions for deploying the Bulkmail application in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
   - [Docker Compose](#docker-compose)
   - [Kubernetes](#kubernetes)
   - [Netlify Functions](#netlify-functions)
3. [Environment Configuration](#environment-configuration)
4. [Database Migrations](#database-migrations)
5. [Scaling](#scaling)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Security Considerations](#security-considerations)

## Prerequisites

- Docker and Docker Compose
- Node.js 16+ and npm/yarn
- PostgreSQL 13+
- Redis 6+
- SMTP server or email service provider credentials

## Deployment Options

### Docker Compose

For development and small to medium production deployments:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bulkmail.git
   cd bulkmail
   ```

2. Configure environment variables:
   ```bash
   cp .env.prod.example .env
   # Edit .env with your configuration
   ```

3. Generate secure secrets:
   ```bash
   node scripts/generate-secrets.js
   ```

4. Start the services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

5. Run database migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx typeorm-ts-node-commonjs migration:run
   ```

6. Access the application:
   - Frontend: http://localhost
   - API: http://localhost/api
   - Adminer (database management): http://localhost:8080

### Kubernetes

For production deployments with Kubernetes:

1. Install [kubectl](https://kubernetes.io/docs/tasks/tools/) and [helm](https://helm.sh/)

2. Create a Kubernetes secret with your environment variables:
   ```bash
   kubectl create secret generic bulkmail-env --from-env-file=.env
   ```

3. Deploy using the provided Helm chart:
   ```bash
   helm install bulkmail ./charts/bulkmail
   ```

4. Access the application using the configured ingress.

### Netlify Functions

For serverless deployment:

1. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Link your Netlify site:
   ```bash
   netlify link
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

## Environment Configuration

### Required Variables

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=bulkmail
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Email
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# Frontend
VITE_API_URL=/api
```

### Optional Variables

```env
# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# IP Rotation
IP_ROTATION_MAX_EMAILS=1000
IP_ROTATION_COOLDOWN=60

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key
```

## Database Migrations

### Creating a New Migration

```bash
docker-compose -f docker-compose.prod.yml exec backend \
  npx typeorm-ts-node-commonjs migration:create ./src/migrations/YourMigrationName
```

### Running Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend \
  npx typeorm-ts-node-commonjs migration:run
```

### Reverting a Migration

```bash
docker-compose -f docker-compose.prod.yml exec backend \
  npx typeorm-ts-node-commonjs migration:revert
```

## Scaling

### Horizontal Scaling

To scale the backend service:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Database Scaling

For production, consider using a managed database service like:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL

### Redis Scaling

For production, consider using a managed Redis service:
- Redis Labs
- AWS ElastiCache
- Google Memorystore

## Monitoring and Logging

### Built-in Monitoring

The application includes a monitoring dashboard at `/admin/monitoring` with:
- System metrics (CPU, memory, disk usage)
- Email delivery statistics
- Error rates and logs
- Rate limiting status

### External Monitoring

Integrate with external monitoring services by setting these environment variables:

```env
# Sentry for error tracking
SENTRY_DSN=your_sentry_dsn

# New Relic for APM
NEW_RELIC_LICENSE_KEY=your_new_relic_key
NEW_RELIC_APP_NAME=bulkmail

# Datadog
DD_AGENT_HOST=datadog-agent
DD_TRACE_AGENT_PORT=8126
```

### Log Management

Logs are sent to stdout/stderr and can be collected using:
- Docker logging drivers
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd
- AWS CloudWatch

## Backup and Recovery

### Database Backups

Create a backup:

```bash
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres bulkmail > backup_$(date +%Y%m%d).sql
```

Restore from backup:

```bash
cat backup_20230717.sql | docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres bulkmail
```

### Automated Backups

For production, set up automated backups using:
- `pg_dump` with cron
- AWS RDS automated backups
- WAL-E/WAL-G for continuous archiving

## Security Considerations

### SSL/TLS

Always use HTTPS in production. Configure your reverse proxy (Nginx, Traefik) with valid SSL certificates from Let's Encrypt.

### Secrets Management

- Never commit sensitive data to version control
- Use environment variables or a secrets management service
- Rotate secrets regularly

### Rate Limiting

Rate limiting is enabled by default. Adjust the following variables as needed:

```env
# Global API rate limit (requests per window)
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# Authentication rate limit
AUTH_RATE_LIMIT_WINDOW=15m
AUTH_RATE_LIMIT_MAX=5

# Email sending rate limit
EMAIL_RATE_LIMIT_WINDOW=1h
EMAIL_RATE_LIMIT_MAX=100
```

### Security Headers

The application includes security headers by default. Ensure your reverse proxy doesn't strip these headers.

## Troubleshooting

### Common Issues

1. **Database connection issues**
   - Verify database credentials in `.env`
   - Check if the database container is running
   - Check database logs: `docker-compose logs db`

2. **Email delivery failures**
   - Verify SMTP credentials
   - Check spam folder
   - Check email service provider's sending limits

3. **Rate limiting issues**
   - Check rate limit headers in the response
   - Adjust rate limit settings in `.env`

### Getting Help

If you encounter any issues, please file an issue on the [GitHub repository](https://github.com/yourusername/bulkmail/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
