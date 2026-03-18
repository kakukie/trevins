# 🚀 Trevins Event & Ticketing System - Deployment Guide

## 📋 Prerequisites

Sebelum memulai deployment, pastikan Anda memiliki:

### Software Requirements:
- ✅ Node.js 20+ (untuk build lokal)
- ✅ Docker & Docker Compose (untuk containerization)
- ✅ Git (untuk version control)
- ✅ Code editor (VS Code recommended)

### Account Requirements:
- ✅ Supabase Account (untuk PostgreSQL database hosting)
  - Atau PostgreSQL server yang sudah ada
- ✅ Brevo Account (untuk email service)
  - API Key: https://www.brevo.com/account/apikeys
- ✅ VPS Provider (DigitalOcean, AWS, Google Cloud, dll)
- ✅ Domain Name (opsional, untuk production)

---

## 🔧 Step 1: Environment Setup

### 1.1 Copy Environment File
```bash
# Copy example environment file
cp .env.example .env

# Edit with your actual values
nano .env
```

### 1.2 Configure Environment Variables

Buka `.env` file dan isi dengan nilai-nilai berikut:

```env
# Database Configuration (Supabase)
DATABASE_URL="postgresql://postgres:Masukajah123!@db.elgqnlgykhsqwzgxwfst.supabase.co:5432/postgres"

# JWT Configuration
JWT_SECRET="963be2ee942152f04783d698fc98d688"
JWT_EXPIRES_IN="7d"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Brevo Email Service
BREVO_API_KEY="xkeysib-123456789"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"
BREVO_SENDER_NAME="Trevins"

# Payment Gateway (Mock/Production)
PAYMENT_GATEWAY_URL="https://api.payment-gateway.com"
PAYMENT_GATEWAY_API_KEY="your-payment-api-key"

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE="5242880"
NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"
```

**Important Tips:**
- 🔐 **JWT_SECRET** harus unik dan minimal 32 karakter
- 🔐 **DATABASE_URL** dapat dari dashboard Supabase
- 🔐 Jangan commit `.env` file ke Git!

---

## 🗄️ Step 2: Database Setup

### 2.1 Setup Supabase (Recommended)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Wait for database initialization
4. Go to Settings → Database
5. Copy connection string ke `.env` file

### 2.2 Alternative: Self-hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE trevins;
CREATE USER trevins_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE trevins TO trevins_user;
\q
```

---

## 🔨 Step 3: Local Build & Testing

### 3.1 Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Generate Prisma Client
npm run db:generate
```

### 3.2 Run Database Migrations
```bash
# Push schema to database
npm run db:push

# Atau gunakan migration
npm run db:migrate
```

### 3.3 Seed Database (Optional)
```bash
# Add sample data
npm run db:seed
```

### 3.4 Build Application
```bash
# Build for production
npm run build

# Verifikasi output
ls -la .next/standalone/
```

**Expected Output:**
```
✓ Compiled successfully in ~20s
✓ Finished TypeScript in ~15s
✓ Collecting page data in ~1.5s
✓ Generating static pages in ~0.8s
✓ Finalizing page optimization in ~2s
```

### 3.5 Test Local Application
```bash
# Start production server
npm start

# Atau development mode
npm run dev
```

**Access Application:**
- Frontend: http://localhost:3000
- Health Check: http://localhost:3000/api/health
- API Documentation: (check README.md)

---

## 🐳 Step 4: Docker Build

### 4.1 Build Docker Image
```bash
# Build with tag
docker build -t trevins-app .

# Build with build args (optional)
docker build \
  --build-arg NODE_ENV=production \
  -t trevins-app .
```

**Build Progress:**
- Stage 1: Dependencies (cached jika tidak ada perubahan)
- Stage 2: Build application
- Stage 3: Production runtime

### 4.2 Test Docker Container
```bash
# Run container
docker run -d \
  --name trevins-test \
  -p 3000:3000 \
  --env-file .env \
  trevins-app

# Check logs
docker logs trevins-test

# Stop container
docker stop trevins-test
docker rm trevins-test
```

### 4.3 Use Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🚀 Step 5: VPS Deployment

### 5.1 Connect to VPS
```bash
# SSH ke VPS
ssh user@your-vps-ip

# Atau gunakan SSH key
ssh -i ~/.ssh/your-key.pem user@your-vps-ip
```

### 5.2 Install Docker on VPS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 5.3 Deploy Using Script
```bash
# Clone repository (atau copy files)
git clone https://github.com/your-username/trevins.git
cd trevins

# Atau upload files menggunakan SCP
scp -r trevins/ user@vps-ip:/:/path/to/deploy/

# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

### 5.4 Manual Deployment Steps

```bash
# 1. Copy project files to VPS
mkdir -p /opt/trevins
cd /opt/trevins

# Upload files (gunakan SCP, FTP, atau Git)

# 2. Create .env file
nano .env
# Isi dengan production values

# 3. Build Docker image
docker build -t trevins-app .

# 4. Run container
docker run -d \
  --name trevins \
  -p 3000:3000 \
  --restart unless-stopped \
  --env-file .env \
  -v /opt/trevins/data:/app/data \
  trevins-app

# 5. Verify running
docker ps
docker logs trevins
```

---

## 🌐 Step 6: Caddy Reverse Proxy Setup

### 6.1 Install Caddy
```bash
# Install Caddy
curl -1 https://getcaddy.com | bash -

# Verify installation
caddy version
```

### 6.2 Configure Caddyfile

Buka `Caddyfile` (sudak ada di project root):

```caddy
{
    # Global options
    email your-email@example.com
}

# HTTP - Redirect to HTTPS
http://yourdomain.com {
    redir https://yourdomain.com{uri}
}

# HTTPS - Main configuration
https://yourdomain.com {
    # Reverse proxy to Next.js app
    reverse_proxy localhost:3000 {
        # Health check
        health_uri /api/health
        health_interval 10s
        health_timeout 5s
    }
    
    # Enable compression
    encode gzip zstd
    
    # Security headers
    header {
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"
        # Prevent MIME sniffing
        X-Content-Type-Options "nosniff"
        # XSS Protection
        X-XSS-Protection "1; mode=block"
    }
    
    # File upload limits
    @fileuploads {
        path /api/bookings/* /api/events/*
    }
    
    @other {
        not path @fileuploads
    }
    
    # Different limits for file uploads
    handle @fileuploads {
        request_body {
            max_size 10MB
        }
        reverse_proxy localhost:3000
    }
    
    handle @other {
        reverse_proxy localhost:3000
    }
}

# API subdomain (optional)
https://api.yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
}

# Admin subdomain (optional)
https://admin.yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
}
```

### 6.3 Start Caddy
```bash
# Start Caddy with config
sudo caddy run --config /path/to/Caddyfile

# Atau install as systemd service
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy
```

---

## ✅ Step 7: Post-Deployment Checks

### 7.1 Verify Application Health
```bash
# Check health endpoint
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-03-10T12:00:00Z"}
```

### 7.2 Test Critical Endpoints
```bash
# Test API base
curl https://yourdomain.com/api

# Test authentication
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  https://yourdomain.com/api/auth/login

# Test events endpoint
curl https://yourdomain.com/api/events
```

### 7.3 Check Database Connection
```bash
# SSH ke VPS
ssh user@vps-ip

# Check Docker container
docker ps

# Check logs for database errors
docker logs trevins | grep -i "database\|prisma"
```

### 7.4 Monitor Performance
```bash
# Check resource usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## 🔒 Step 8: SSL Certificate Setup

### Using Caddy (Automatic)
Caddy otomatis menguruskan SSL certificates menggunakan Let's Encrypt:
- ✅ Otomatis obtain dan renew certificates
- ✅ HTTPS by default
- ✅ OCSP stapling
- ✅ HTTP/2 support

### Manual SSL (if needed)
```bash
# Generate self-signed certificate (testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem

# Atau gunakan Certbot untuk Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

---

## 📊 Step 9: Monitoring & Maintenance

### 9.1 Setup Monitoring
```bash
# Install monitoring tools (optional)
sudo apt install htop iotop

# Monitor Docker containers
watch -n 1 'docker ps && docker stats --no-stream'

# Monitor application logs
docker logs -f trevins
```

### 9.2 Database Backups
```bash
# Create backup script
cat > /opt/trevins/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/trevins"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
# Keep last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/trevins/backup.sh

# Add to crontab
crontab -e
0 2 * * * /opt/trevins/backup.sh
```

### 9.3 Update Deployment
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Atau gunakan deploy script
./deploy.sh
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails
**Symptom:** `npm run build` atau `docker build` gagal

**Solutions:**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build

# Check Node.js version
node --version  # Should be 20+

# Check disk space
df -h
```

### Issue 2: Database Connection Error
**Symptom:** Error "Database connection failed"

**Solutions:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Check Prisma schema
npm run db:push
```

### Issue 3: Container Not Starting
**Symptom:** Docker container exits immediately

**Solutions:**
```bash
# Check logs
docker logs trevins

# Check environment variables
docker exec trevins env

# Restart container
docker restart trevins
```

### Issue 4: SSL Certificate Issues
**Symptom:** HTTPS tidak berfungsi

**Solutions:**
```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Verify DNS
dig yourdomain.com

# Check port 80 & 443
sudo netstat -tulpn | grep -E ':(80|443)'
```

---

## 📚 Quick Reference Commands

### Local Development:
```bash
npm install              # Install dependencies
npm run dev            # Start dev server
npm run build          # Build for production
npm start               # Start production server
npm run db:push        # Push schema to DB
npm run db:migrate      # Run migrations
npm run lint            # Check code quality
```

### Docker Commands:
```bash
docker build -t trevins-app .              # Build image
docker run -d -p 3000:3000 trevins-app   # Run container
docker ps                                   # List containers
docker logs trevins                         # View logs
docker stop trevins                        # Stop container
docker rm trevins                          # Remove container
docker-compose up -d --build               # Compose up
docker-compose down                         # Compose down
```

### VPS Commands:
```bash
ssh user@vps-ip                          # Connect to VPS
docker exec -it trevins sh               # Enter container
docker exec trevins npm run db:migrate   # Run migration in container
```

---

## 🔒 Security Checklist

Sebelum go-live, pastikan:

- [ ] ✅ Change semua default passwords
- [ ] ✅ Generate strong JWT_SECRET
- [ ] ✅ Configure HTTPS/SSL
- [ ] ✅ Setup firewall rules (ufw)
- [ ] ✅ Enable automatic database backups
- [ ] ✅ Configure rate limiting (opsional)
- [ ] ✅ Setup monitoring and alerting
- [ ] ✅ Review error handling
- [ ] ✅ Test all authentication flows
- [ ] ✅ Validate input sanitization
- [ ] ✅ Configure CORS properly
- [ ] ✅ Setup log rotation

---

## 📞 Support & Documentation

- **GitHub Issues:** https://github.com/your-username/trevins/issues
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Docker Docs:** https://docs.docker.com/
- **Caddy Docs:** https://caddyserver.com/docs/

---

## 🎉 Deployment Complete!

Selamat! Aplikasi Trevins sudah berjalan di production.

### Next Steps:
1. 🔐 Setup analytics (Google Analytics, dll)
2. 📧 Configure error tracking (Sentry, dll)
3. 📊 Setup performance monitoring
4. 🔍 Configure search engine optimization
5. 📧 Setup CI/CD pipeline
6. 📖️ Create user documentation
7. 🧪 Perform load testing
8. 📅 Setup disaster recovery plan

### Maintenance Schedule:
- [ ] Daily: Check error logs
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit

---

**Last Updated:** 10 Maret 2026
**Version:** 1.0.0
**Deployment Status:** ✅ Production Ready