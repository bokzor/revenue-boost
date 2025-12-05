# Stage 1: Install dependencies (cached layer)
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Stage 2: Build application
FROM node:24-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments
ARG BUILD_MODE=production
ARG SENTRY_AUTH_TOKEN
ARG APP_VERSION

# Set environment variables for build
ENV BUILD_MODE=$BUILD_MODE
ENV NODE_ENV=production
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV APP_VERSION=$APP_VERSION

# Build both the app AND the storefront bundles
RUN npm run build && npm run build:storefront

# Stage 3: Production runtime (minimal image)
FROM node:24-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

# Copy only what's needed for runtime
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/extensions/storefront-popup ./extensions/storefront-popup
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Clear sensitive build args from runtime environment
ENV SENTRY_AUTH_TOKEN=

EXPOSE 3000
CMD ["npm", "run", "docker-start"]
