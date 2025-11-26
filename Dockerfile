FROM node:24-alpine
RUN apk add --no-cache openssl
EXPOSE 3000
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force
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

# Clear sensitive build args from runtime environment
ENV SENTRY_AUTH_TOKEN=

CMD ["npm", "run", "docker-start"]
