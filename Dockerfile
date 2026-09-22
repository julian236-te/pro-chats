# Multi-stage Dockerfile for Pro Chats (Full-stack Node.js + React)
FROM node:20-alpine AS builder

WORKDIR /app

# Build React Client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install root dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy Server
COPY server/ ./server/

# Copy compiled frontend from builder
COPY --from=builder /app/client/dist ./client/dist

# Expose default port
EXPOSE 4000

# Start application
CMD ["node", "server/index.js"]
