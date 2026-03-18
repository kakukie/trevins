#!/bin/bash

# 🚀 Trevins Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e"\n${GREEN}=== $1 ===${NC}"
}

# Check if .env exists
check_env() {
    print_step "Checking environment configuration"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_info "Creating .env from .env.example..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_info "✓ Created .env file"
            print_warning "Please edit .env with your credentials before continuing"
            print_info "Required variables: DATABASE_URL, JWT_SECRET, BREVO_API_KEY"
            exit 1
        else
            print_error ".env.example not found!"
            exit 1
        fi
    else
        print_info "✓ .env file found"
    fi
}

# Install dependencies
install_deps() {
    print_step "Installing dependencies"
    
    if command -v bun &> /dev/null; then
        print_info "Using Bun package manager"
        bun install
    elif command -v npm &> /dev/null; then
        print_info "Using npm package manager"
        npm install
    else
        print_error "Neither bun nor npm found. Please install one of them."
        exit 1
    fi
    
    print_info "✓ Dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    print_step "Generating Prisma client"
    
    if command -v bun &> /dev/null; then
        bun run db:generate
    else
        npm run db:generate
    fi
    
    print_info "✓ Prisma client generated"
}

# Build Docker images
build_docker() {
    print_step "Building Docker images"
    
    docker-compose build --no-cache
    
    print_info "✓ Docker images built"
}

# Start Docker containers
start_docker() {
    print_step "Starting Docker containers"
    
    # Stop existing containers if running
    if docker-compose ps | grep -q "Up"; then
        print_info "Stopping existing containers..."
        docker-compose down
    fi
    
    # Start containers
    docker-compose up -d
    
    print_info "✓ Containers started"
}

# Check container health
check_health() {
    print_step "Checking container health"
    
    sleep 5  # Wait for containers to start
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        print_info "✓ All containers are running"
    else
        print_error "Some containers failed to start"
        docker-compose ps
        exit 1
    fi
    
    # Check application health endpoint
    print_info "Checking application health endpoint..."
    if curl -s http://localhost:80/api/health > /dev/null 2>&1; then
        print_info "✓ Application is healthy"
    else
        print_warning "Health check failed (endpoint may not be ready yet)"
        print_info "Check logs with: docker-compose logs -f"
    fi
}

# Display deployment info
show_info() {
    print_step "Deployment Complete!"
    
    echo -e "\n${GREEN}🎉 Trevins is now running!${NC}\n"
    echo -e "Application URL: ${GREEN}http://localhost:80${NC}"
    echo -e "Admin Interface: ${GREEN}http://localhost:81${NC}\n"
    echo -e "Useful commands:"
    echo -e "  View logs:      docker-compose logs -f"
    echo -e "  Stop app:       docker-compose down"
    echo -e "  Restart app:    docker-compose restart"
    echo -e "  Check status:   docker-compose ps"
    echo -e "\n${GREEN}For full deployment guide, see DEPLOYMENT.md${NC}\n"
}

# Main deployment flow
main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                  🚀 Trevins Deployment Script               ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        print_info "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        print_info "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_info "✓ Docker and Docker Compose found"
    
    # Run deployment steps
    check_env
    install_deps
    generate_prisma
    build_docker
    start_docker
    check_health
    show_info
}

# Run main function
main "$@"