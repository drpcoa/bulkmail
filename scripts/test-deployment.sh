#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting BulkMail Deployment Test...${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
for cmd in docker docker-compose node npm curl; do
  if ! command_exists "$cmd"; then
    echo -e "${RED}❌ Error: $cmd is not installed.${NC}"
    exit 1
  fi
done

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}ℹ️  Creating .env file from example...${NC}"
  cp .env.prod.example .env
  
  # Generate secure secrets
  echo -e "${YELLOW}🔒 Generating secure secrets...${NC}"
  node scripts/generate-secrets.js
  
  # Update .env with generated secrets
  if [ -f .env.local ]; then
    cat .env.local >> .env
    rm .env.local
  fi
  
  echo -e "${GREEN}✅ .env file created with secure secrets${NC}"
else
  echo -e "${GREEN}✅ Using existing .env file${NC}"
fi

# Start services
if [ "$1" != "--no-start" ]; then
  echo -e "${YELLOW}🚀 Starting services with Docker Compose...${NC}"
  docker-compose -f docker-compose.prod.yml up -d --build
  
  echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
  # Wait for database to be ready
  until docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
  done
  echo -e "\n${GREEN}✅ Database is ready${NC}"
  
  # Run migrations
  echo -e "${YELLOW}🔄 Running database migrations...${NC}"
  docker-compose -f docker-compose.prod.yml exec backend npx typeorm-ts-node-commonjs migration:run
  
  # Run seeds
  echo -e "${YELLOW}🌱 Running database seeds...${NC}"
  docker-compose -f docker-compose.prod.yml exec backend npm run seed:run
  
  # Wait for backend to be ready
  echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
  until curl -s http://localhost:3000/api/health > /dev/null; do
    echo -n "."
    sleep 1
  done
  echo -e "\n${GREEN}✅ Backend is ready${NC}"
  
  # Wait for frontend to be ready
  echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
  until curl -s http://localhost > /dev/null; do
    echo -n "."
    sleep 1
  done
  echo -e "\n${GREEN}✅ Frontend is ready${NC}"
  
  # Run API tests
  echo -e "${YELLOW}🧪 Running API tests...${NC}"
  if [ -d "backend/__tests__" ]; then
    docker-compose -f docker-compose.prod.yml exec backend npm test
  else
    echo -e "${YELLOW}⚠️  No tests found in backend/__tests__${NC}"
  fi
  
  echo -e "\n${GREEN}🎉 Deployment test completed successfully!${NC}"
  echo -e "\nAccess the application at: http://localhost"
  echo -e "API is available at: http://localhost/api"
  echo -e "\nTo stop the services, run: docker-compose -f docker-compose.prod.yml down"
else
  echo -e "${GREEN}✅ Environment setup completed (services not started)${NC}"
fi
