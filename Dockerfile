# 1. Builder stage for React frontend & Node backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# Build Frontend (Vite) and Backend (esbuild)
RUN npm run build

# 2. Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN npm ci --only=production

# Expose backend port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]

