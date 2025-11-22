   FROM node:24-alpine
   RUN apk add --no-cache openssl
   EXPOSE 3000
   WORKDIR /app
   COPY package.json package-lock.json* ./
   RUN npm ci && npm cache clean --force
   COPY . .

   # Accept BUILD_MODE as build argument (default to production)
   ARG BUILD_MODE=production
   ENV BUILD_MODE=$BUILD_MODE

   # Build both the app AND the storefront bundles
   RUN npm run build && npm run build:storefront

   CMD ["npm", "run", "docker-start"]
   ENV NODE_ENV=production
