# 🎯 Trevins Quick Start Guide

Quick guide to set up and run Trevins locally with Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- Git (optional, for cloning)
- Supabase account (for PostgreSQL database)
- Brevo account (for email service)

## 🚀 Quick Setup (5 minutes)

### 1. Clone or Navigate to Project

If you have the project files:
```bash
cd path/to/trevins
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
# (Open in your favorite editor)
```

**Required Environment Variables:**

```bash
# Database (Get from Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# Generate strong secrets
JWT_SECRET="[GENERATE_WITH: openssl rand -base64 32]"
JWT_EXPIRES_IN="7d"

# Brevo Email (Get from Brevo dashboard)
BREVO_API_KEY="[YOUR_BREVO_API_KEY]"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"
BREVO_SENDER_NAME="Trevins"

# Application URLs (for local testing)
NEXT_PUBLIC_APP_URL="http://localhost"
NEXTAUTH_URL="http://localhost"
NEXTAUTH_SECRET="[GENERATE_WITH: openssl rand -base64 32]"
```

### 3. Setup Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to be ready (~2 minutes)
4. Go to Settings > Database
5. Copy connection string (JDBC URI format)
6. Update `DATABASE_URL` in `.env` file

### 4. Generate Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

### 5. Start Application

**Option A: Using Deployment Script (Recommended)**

```bash
# On Linux/Mac with bash
./deploy.sh

# On Windows (using Git Bash or WSL)
bash deploy.sh
```

**Option B: Manual Start**

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Build and start Docker containers
docker-compose up -d --build
```

### 6. Verify Deployment

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check health endpoint
curl http://localhost:80/api/health
```

### 7. Access Application

- **Main Application**: http://localhost:80
- **Admin Interface**: http://localhost:81
- **API Health Check**: http://localhost:80/api/health

## 🛠️ Common Issues & Solutions

### Issue: Port 80 is already in use

**Solution**: Change port in `docker-compose.yml`:

```yaml
services:
  caddy:
    ports:
      - "8080:80"  # Use 8080 instead of 80
```

Then access at: http://localhost:8080

### Issue: Database connection failed

**Solution**: 
1. Verify Supabase project is active
2. Check `DATABASE_URL` in `.env` is correct
3. Ensure Prisma client is generated: `bun run db:generate`

### Issue: Containers won't start

**Solution**:

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Start again
docker-compose up -d
```

### Issue: Can't access application

**Solution**:

```bash
# Check if containers are running
docker-compose ps

# Check Caddy logs
docker-compose logs caddy

# Check app logs
docker-compose logs app

# Try accessing directly (bypass Caddy)
curl http://localhost:3000
```

## 📊 Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f caddy

# Stop containers
docker-compose stop

# Start containers
docker-compose start

# Restart containers
docker-compose restart

# Remove containers (keep data)
docker-compose down

# Remove containers and volumes (delete data)
docker-compose down -v

# Update and rebuild
docker-compose up -d --build

# Execute command in container
docker-compose exec app sh

# Check container stats
docker stats
```

## 🗄️ Database Operations

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (development)
bun run db:push

# Create migration
bun run db:migrate

# Reset database
bun run db:reset

# Seed database
bun run db:seed
```

## 📧 Testing Email Service

To test Brevo email integration:

1. Add test route or use API endpoints
2. Check Brevo dashboard for sent emails
3. Verify email delivery

## 💳 Testing Payment Gateway

The mock payment gateway simulates real payments:

1. Initiate payment through API
2. Check response for payment URL
3. Complete payment (simulated 95% success rate)
4. Verify payment status

## 🔄 Next Steps

After successful local deployment:

1. ✅ Test all features
2. ✅ Verify database operations
3. ✅ Test email notifications
4. ✅ Test payment flow
5. ✅ Review logs for errors
6. ✅ Prepare for VPS deployment

For VPS deployment, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 📚 Additional Resources

- [Full Deployment Guide](DEPLOYMENT.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f`
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
3. Check container status: `docker-compose ps`
4. Verify environment variables in `.env`

---

**Happy Deploying! 🚀**