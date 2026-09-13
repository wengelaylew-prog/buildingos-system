# 1. Builder stage for React frontend & Node backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# CRITICAL FIX for esbuild cross-platform binary resolution:
# Remove package-lock.json so npm forces resolution of Linux musl binaries 
# instead of relying on the Windows lockfile, which causes esbuild to crash.
RUN rm -f package-lock.json && npm install

COPY . .

# Build Frontend & Backend natively via npm scripts
RUN npm run build

# 2. Production Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only (without lockfile to ensure native binaries match)
RUN npm install --omit=dev

# Expose backend port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
