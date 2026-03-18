# 🚀 Trevins Deployment Guide

Complete guide for deploying Trevins application to production using Docker.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Supabase account (for PostgreSQL database)
- Brevo account (for email service)
- Domain name (optional, for SSL production deployment)
- VPS with minimum specs:
  - 2 CPU cores
  - 4GB RAM
  - 20GB SSD storage

## 🔧 Setup Instructions

### 1. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your credentials:
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# JWT Authentication
JWT_SECRET="[GENERATE_STRONG_SECRET]"
JWT_EXPIRES_IN="7d"

# Brevo Email Service
BREVO_API_KEY="[YOUR_BREVO_API_KEY]"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"
BREVO_SENDER_NAME="Trevins"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="[GENERATE_ANOTHER_SECRET]"
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to Settings > Database
3. Get your connection string:
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`
4. Add the connection string to your `.env` file
5. (Optional) Enable Row Level Security for better security

### 3. Generate Strong Secrets

Generate secure random secrets for JWT and NextAuth:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

### 4. Database Migration

If migrating from existing SQLite database:

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run migration script
bun run scripts/migrate-db.ts
```

For fresh installation:

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Seed database with initial data
bun run db:seed
```

## 🐳 Docker Deployment

### Local Deployment (Docker Desktop)

1. Start Docker Desktop
2. Build and start containers:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

3. Access the application:
   - Application: http://localhost:80
   - Admin interface: http://localhost:81

### VPS Deployment

1. **Prepare VPS**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/trevins
sudo chown $USER:$USER /opt/trevins
```

2. **Deploy Application**:

```bash
# Upload files to VPS (from your local machine)
scp -r . user@your-vps-ip:/opt/trevins/

# SSH into VPS
ssh user@your-vps-ip

# Navigate to app directory
cd /opt/trevins

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f app
```

3. **Configure Firewall**:

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 81/tcp  # For admin interface

# Enable firewall
sudo ufw enable
```

## 🔒 SSL/HTTPS Setup (Production)

### Using Domain with Caddy

1. Update `Caddyfile`:

```caddy
trevins.com {
    # Automatic SSL with Let's Encrypt
    tls {
        dns cloudflare YOUR_CLOUDFLARE_API_TOKEN
    }
    
    # ... rest of configuration
}
```

2. Add DNS records:
   - A record: `@` → `your-vps-ip`
   - A record: `www` → `your-vps-ip`

3. Restart Caddy:

```bash
docker-compose restart caddy
```

## 📊 Monitoring & Maintenance

### View Logs

```bash
# Application logs
docker-compose logs -f app

# Caddy logs
docker-compose logs -f caddy

# All logs
docker-compose logs -f
```

### Health Checks

```bash
# Check container status
docker-compose ps

# Check application health
curl http://localhost:80/api/health
```

### Backup

```bash
# Backup database (from VPS)
docker exec -t trevins-app pg_dump [DATABASE_NAME] > backup.sql

# Backup application data
tar -czf backup-$(date +%Y%m%d).tar.gz public/images/
```

### Updates

```bash
# Pull latest changes
git pull

# Rebuild containers
docker-compose up -d --build

# Clean up old images
docker image prune -f
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs app

# Rebuild without cache
docker-compose build --no-cache

# Remove volumes and start fresh
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

1. Verify DATABASE_URL in `.env`
2. Check Supabase project status
3. Ensure Prisma client is generated:
```bash
bun run db:generate
```

### Port Conflicts

If ports 80, 443, or 81 are in use:

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Change ports in docker-compose.yml
```

## 📝 Best Practices

1. **Security**:
   - Never commit `.env` file
   - Use strong secrets
   - Enable SSL in production
   - Regular security updates

2. **Performance**:
   - Enable caching for static files
   - Use CDN for static assets
   - Optimize images

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor logs regularly
   - Set up alerts

4. **Backups**:
   - Daily database backups
   - Weekly full backups
   - Test restore process

## 🔗 Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Supabase Documentation](https://supabase.com/docs)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review troubleshooting section
- Check documentation links above