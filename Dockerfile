FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies needed for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install ALL dependencies (need devDeps for build)
RUN npm ci

# Copy all files
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the API
WORKDIR /app
RUN npm run build:api

# Prune dev dependencies to reduce size
RUN npm prune --production
WORKDIR /app/apps/api
RUN npm prune --production

# --- Production Runner ---
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy only production files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts

# Expose port
EXPOSE 3002

# Set working directory to API
WORKDIR /app/apps/api

# Start command using the enhanced script
CMD ["node", "scripts/start-production.js"]
