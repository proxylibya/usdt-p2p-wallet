FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies needed for build (if any)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies (use ci for reproducible builds)
RUN npm ci

# Copy all files
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the API
WORKDIR /app
RUN npm run build:api

# --- Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
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
