#!/bin/bash
# Start local test server with TEST_MODE enabled
# This server runs on port 3001 alongside your main dev server

set -e

# Load staging environment
set -a
source .env.staging.env
set +a

# Override with test mode settings
export TEST_MODE=true
export TEST_SHOP_DOMAIN=revenue-boost-staging.myshopify.com
export PORT=3001

echo "🧪 Starting local test server..."
echo "   Port: 3001"
echo "   TEST_MODE: $TEST_MODE"
echo "   TEST_SHOP_DOMAIN: $TEST_SHOP_DOMAIN"
echo "   DATABASE: staging (Neon)"
echo ""
echo "Your main dev server (npm run dev) can still run on its own port."
echo ""

npx react-router dev --port=3001

