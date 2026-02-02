FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the API
WORKDIR /app
RUN npm run build:api

# Expose port
EXPOSE 3002

# Set working directory to API
WORKDIR /app/apps/api

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
