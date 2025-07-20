#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}⚠️  Please run as root or with sudo${NC}"
  exit 1
fi

echo -e "${GREEN}🚀 Starting Bulkmail Deployment${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
for cmd in docker docker-compose curl; do
  if ! command_exists "$cmd"; then
    echo -e "${RED}❌ Error: $cmd is not installed.${NC}"
    exit 1
  fi
done

# Set deployment directory
DEPLOY_DIR="/opt/bulkmail"
BACKUP_DIR="$DEPLOY_DIR/backups/$(date +%Y%m%d_%H%M%S)"

# Create deployment directory if it doesn't exist
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"

# Check if this is an update
IS_UPDATE=false
if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
  IS_UPDATE=true
  echo -e "${YELLOW}ℹ️  Updating existing installation${NC}"
  
  # Backup current configuration and data
  echo -e "${YELLOW}📦 Backing up current installation...${NC}"
  
  # Backup configuration
  if [ -f "$DEPLOY_DIR/.env" ]; then
    cp "$DEPLOY_DIR/.env" "$BACKUP_DIR/.env.bak"
  fi
  
  # Backup database
  if docker ps -q -f name=bulkmail_db; then
    echo -e "${YELLOW}💾 Backing up database...${NC}"
    docker exec bulkmail_db pg_dump -U postgres bulkmail > "$BACKUP_DIR/db_backup.sql"
  fi
  
  # Stop and remove existing containers
  echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
  cd "$DEPLOY_DIR"
  docker-compose down
else
  echo -e "${GREEN}🆕 New installation detected${NC}"
fi

# Copy new files
echo -e "${YELLOW}📦 Copying new files...${NC}"
cp -r /path/to/your/local/bulkmail/* "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

# Set up environment
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo -e "${YELLOW}⚙️  Setting up environment...${NC}"
  cp .env.prod.example .env
  
  # Generate secure secrets
  echo -e "${YELLOW}🔒 Generating secure secrets...${NC}"
  node scripts/generate-secrets.js
  
  # Update .env with generated secrets
  if [ -f ".env.local" ]; then
    cat .env.local >> .env
    rm .env.local
  fi
  
  # Ask for user input for required values
  echo -e "${YELLOW}📝 Please provide the following configuration:${NC}"
  
  read -p "Domain name (e.g., bulkmail.example.com): " DOMAIN_NAME
  read -p "Email (for Let's Encrypt): " EMAIL
  read -p "Database password: " DB_PASSWORD
  read -p "Redis password: " REDIS_PASSWORD
  
  # Update .env with user input
  sed -i "s/yourdomain\.com/$DOMAIN_NAME/g" .env
  sed -i "s/your_secure_db_password/$DB_PASSWORD/g" .env
  sed -i "s/your_secure_redis_password/$REDIS_PASSWORD/g" .env
  
  # Add Let's Encrypt email
  echo "LETSENCRYPT_EMAIL=$EMAIL" >> .env
  
  echo -e "${GREEN}✅ Environment configuration complete${NC}"
fi

# Pull latest images
echo -e "${YELLOW}⬇️  Pulling latest Docker images...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}
docker-compose -f docker-compose.prod.yml exec -T backend npx typeorm-ts-node-commonjs migration:run

# Check if services are running
if docker ps | grep -q 'bulkmail'; then
  echo -e "${GREEN}✅ Bulkmail has been successfully ${IS_UPDATE:-"deployed"}${IS_UPDATE:+"updated"}!${NC}"
  echo -e "\n🌐 Access the application at: https://$DOMAIN_NAME"
  echo -e "🔍 Check the logs with: docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml logs -f"
  
  if [ "$IS_UPDATE" = false ]; then
    echo -e "\n🔑 Initial admin credentials:"
    echo -e "   Email: admin@$DOMAIN_NAME"
    echo -e "   Password: $(grep 'DEFAULT_ADMIN_PASSWORD' .env | cut -d '=' -f2)"
    echo -e "\n⚠️  Please change the default admin password after first login!"
  fi
  
  echo -e "\nBackup of previous installation saved to: $BACKUP_DIR"
else
  echo -e "${RED}❌ Error: Failed to start Bulkmail services${NC}"
  echo -e "Check the logs with: docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml logs"
  exit 1
fi
