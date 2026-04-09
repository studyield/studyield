FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts

# Expose port
EXPOSE 3010

# Run migrations and start server
CMD ["sh", "-c", "echo 'Starting backend server...' && echo 'Running migrations...' && npm run migrate && echo 'Migrations complete. Starting application...' && node dist/main.js"]
