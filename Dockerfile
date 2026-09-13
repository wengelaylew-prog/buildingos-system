# 1. Builder stage for React frontend & Node backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

COPY . .

# Build Frontend (Vite)
RUN node node_modules/vite/bin/vite.js build

# Build Backend (esbuild)
RUN node node_modules/esbuild/bin/esbuild server.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --packages=external \
  --sourcemap \
  --outfile=dist/server.cjs

# 2. Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN npm install --omit=dev

# Expose backend port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
