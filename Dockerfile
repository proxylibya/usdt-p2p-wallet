FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build the API
RUN npm run build:api

# Expose port
EXPOSE 3002

# Start command
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/main.js"]
