# WebSocket Proxy Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start the proxy
CMD ["npm", "start"]

