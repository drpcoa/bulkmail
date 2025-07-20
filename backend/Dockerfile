# Build stage
FROM node:lts-alpine AS builder
WORKDIR /usr/src/app

# Set npm registry and retry settings
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies including devDependencies with retry
RUN npm install --no-package-lock --no-save --no-audit --prefer-offline --retry 5

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Set npm registry and retry settings
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files first for better caching
COPY package*.json ./

# Install only production dependencies with retry
RUN npm install --production --no-package-lock --no-audit --prefer-offline --retry 5

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy other necessary files (like .env, etc.)
COPY .env* ./

# Expose the app port
EXPOSE 3000

# Set non-root user
RUN chown -R node:node /usr/src/app
USER node

# Start the application
CMD ["node", "dist/index.js"]
