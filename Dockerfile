# Production Dockerfile for Frontend
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application - WebSocket URL will be provided at build time
ARG VITE_WEBSOCKET_URL
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}
RUN npm run build

# Install serve to run the production build
RUN npm install -g serve

EXPOSE 5000

# Serve the built app on port 5000
CMD ["serve", "-s", "dist", "-l", "5000"]
