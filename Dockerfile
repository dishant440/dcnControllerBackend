# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built code from builder stage
COPY --from=builder /app/build ./build

# Set default runtime environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
