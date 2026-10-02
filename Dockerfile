# ==========================================
# 1. Builder Stage
# ==========================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code
COPY . .

# Build Astro SSR application
RUN npm run build

# ==========================================
# 2. Production Runner Stage (with Chromium for Puppeteer)
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install Chromium and font packages required by Puppeteer on Debian
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libasound2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium package
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application and static assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose standard Cloud Run port
EXPOSE 8080

# Start Astro standalone Node SSR server
CMD ["node", "./dist/server/entry.mjs"]
