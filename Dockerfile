FROM node:20-alpine

# Install build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy client package files
COPY client/package*.json ./client/

# Install all dependencies
RUN npm install
RUN cd client && npm install

# Copy source
COPY . .

# Build the React frontend
RUN cd client && npm run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
