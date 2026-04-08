#!/bin/bash

echo "Starting Studyield Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${BLUE}Starting Infrastructure Services (Docker)...${NC}"

# Check if backend .env file exists
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}No backend .env file found. Creating from .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}Created backend/.env file. Please update it with your credentials.${NC}"
fi

# Start infrastructure services with docker-compose
docker compose --env-file .env.docker up -d postgres redis qdrant clickhouse

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 5

# Check PostgreSQL health
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker compose --env-file .env.docker ps | grep -q "studyield-postgres.*healthy"; then
        echo -e "${GREEN}PostgreSQL is healthy!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    ((counter+=2))
done

if [ $counter -ge $timeout ]; then
    echo -e "${RED}PostgreSQL failed to start within ${timeout}s${NC}"
    echo -e "${YELLOW}Check logs with: docker compose logs postgres${NC}"
    exit 1
fi

# Check Redis health
echo -n "Checking Redis... "
if docker compose --env-file .env.docker ps | grep -q "studyield-redis.*healthy"; then
    echo -e "${GREEN}healthy!${NC}"
else
    echo -e "${YELLOW}waiting...${NC}"
    sleep 5
fi

# Show service URLs
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Infrastructure Services Started Successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "   PostgreSQL:     ${GREEN}localhost:5432${NC}"
echo -e "   Redis:          ${GREEN}localhost:6379${NC}"
echo -e "   Qdrant:         ${GREEN}http://localhost:6333/dashboard${NC}"
echo -e "   ClickHouse:     ${GREEN}localhost:8123${NC}"
echo ""

# Start backend
cd backend
echo -e "${BLUE}Setting up Backend...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
npm run migrate 2>/dev/null || echo -e "${YELLOW}No pending migrations (or migration script not found).${NC}"

echo -e "${BLUE}Starting backend (NestJS)...${NC}"
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

cd ..

# Start frontend
cd frontend
echo -e "${BLUE}Setting up Frontend...${NC}"

# Check if .env file exists in frontend
if [ ! -f .env ]; then
    echo -e "${YELLOW}No frontend .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}Created frontend/.env file${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Starting Studyield Dev Servers...${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}   Backend API:    ${GREEN}http://localhost:3010${NC}"
echo -e "${BLUE}   Frontend:       ${GREEN}http://localhost:5189${NC}"
echo ""
echo -e "${YELLOW}Tip: Press Ctrl+C to stop the frontend${NC}"
echo -e "${YELLOW}Tip: To stop all services: docker compose down${NC}"
echo ""

# Start frontend dev server
npm run dev
