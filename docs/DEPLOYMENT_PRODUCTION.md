# Production Deployment Guide

Complete guide for deploying Revenue Boost to production using:
- **Google Cloud Run** (compute)
- **Neon** (PostgreSQL)
- **Upstash** (Redis)
- **Sentry** (error monitoring)

---

## 1. Prerequisites

Before starting, ensure you have:
- [ ] Google Cloud account with billing enabled
- [ ] Neon account (https://neon.tech)
- [ ] Upstash account (https://upstash.com)
- [ ] Shopify Partner account
- [ ] Domain name (e.g., `revenue-boost.app`)
- [ ] Sentry account (for error monitoring)
- [ ] GitHub repository with this codebase

---

## 2. Database & Redis Setup

### 2.1. Neon PostgreSQL Setup

1. Go to https://console.neon.tech
2. Create a new project: `revenue-boost-prod`
3. Region: **AWS US East 1 (N. Virginia)** ✅ Already configured
4. Copy the connection string:
   ```
   postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. **Recommended settings:**
   - Enable connection pooling (use pooled connection string for app)
   - Set autoscaling: 0.25 - 2 compute units
   - Enable autosuspend after 5 minutes (cost saving)

### 2.2. Upstash Redis Setup

1. Go to https://console.upstash.com
2. Create a new Redis database: `revenue-boost-prod`
3. Region: **N. Virginia, USA (us-east-1)** ✅ Already configured
4. Copy the connection string:
   ```
   rediss://default:PASSWORD@xxx.upstash.io:6379
   ```
   *(Note: `rediss://` with double 's' for TLS)*

5. **Recommended settings:**
   - Enable TLS
   - Enable eviction (maxmemory-policy: allkeys-lru)

---

## 3. Google Cloud Setup

### 3.1. Create Production Project

```bash
# Create new project
gcloud projects create revenueboost-prod --name="Revenue Boost Production"

# Set as current project
gcloud config set project revenueboost-prod

# Enable billing (do this in GCP Console)
# https://console.cloud.google.com/billing
```

### 3.2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com
```

### 3.3. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create revenueboost-prod \
  --repository-format=docker \
  --location=us-east1 \
  --description="Revenue Boost Production Docker images"
```

### 3.4. Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer"

# Grant required roles
gcloud projects add-iam-policy-binding revenueboost-prod \
  --member="serviceAccount:github-actions@revenueboost-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding revenueboost-prod \
  --member="serviceAccount:github-actions@revenueboost-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding revenueboost-prod \
  --member="serviceAccount:github-actions@revenueboost-prod.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create gcp-sa-key-prod.json \
  --iam-account=github-actions@revenueboost-prod.iam.gserviceaccount.com
```

---

## 4. Domain & SSL Setup

### 3.1. Cloud Run Domain Mapping

```bash
# Verify domain ownership first at:
# https://www.google.com/webmasters/verification/

# Map domain to Cloud Run service (after first deployment)
gcloud run domain-mappings create \
  --service=revenueboost-prod \
  --domain=revenue-boost.app \
  --region=us-east1
```

### 3.2. DNS Configuration

Add these DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | (IP from Cloud Run) |
| AAAA | @ | (IPv6 from Cloud Run) |
| CNAME | www | ghs.googlehosted.com |

---

## 4. Shopify Partner Dashboard Setup

### 4.1. Create Production App

1. Go to https://partners.shopify.com
2. Navigate to **Apps** → **Create app** → **Create app manually**
3. App name: `Revenue Boost`
4. Note down:
   - **Client ID** (API Key): `eaca0ccfd74444b9f79cd7c0cc8e87be`
   - **Client Secret** (API Secret): (from Partner Dashboard)

### 4.2. Configure App Settings

In your app settings:

```
App URL: https://revenue-boost.app/app

Allowed redirection URLs:
  - https://revenue-boost.app/auth/callback
  - https://revenue-boost.app/auth/shopify/callback
  - https://revenue-boost.app/api/auth/callback
```

### 4.3. Configure App Proxy

```
Subpath prefix: apps
Subpath: revenue-boost
Proxy URL: https://revenue-boost.app
```

### 4.4. Get CLI Partners Token

1. Go to Partner Dashboard → Settings → CLI tokens
2. Create new token with scopes: `read_apps`, `write_apps`
3. Save as `SHOPIFY_CLI_PARTNERS_TOKEN`

---

## 6. GitHub Secrets Configuration

Go to your repo → Settings → Secrets and variables → Actions

### 6.1. Required Secrets for Production Environment

Create an environment called `production` and add these secrets:

| Secret Name | Description | Example/Source |
|-------------|-------------|----------------|
| `GCP_SA_KEY_PROD` | GCP service account JSON key | Content of `gcp-sa-key-prod.json` |
| `DATABASE_URL` | Neon PostgreSQL connection | `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
| `REDIS_URL` | Upstash Redis connection | `rediss://default:xxx@xxx.upstash.io:6379` |
| `SESSION_SECRET` | 32+ char random string | `openssl rand -hex 32` |
| `INTERNAL_API_SECRET` | 32+ char random string | `openssl rand -hex 32` |
| `SHOPIFY_API_KEY` | Shopify Client ID | From Partner Dashboard |
| `SHOPIFY_API_SECRET` | Shopify Client Secret | From Partner Dashboard |
| `SHOPIFY_CLI_PARTNERS_TOKEN` | CLI auth token | From Partner Dashboard → Settings → CLI tokens |
| `SENTRY_DSN` | Sentry DSN URL | From Sentry project settings |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | From Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Sentry organization slug | From Sentry URL |
| `SENTRY_PROJECT` | Sentry project name | From Sentry project settings |

### 6.2. Generate Secrets

```bash
# Generate SESSION_SECRET
openssl rand -hex 32

# Generate INTERNAL_API_SECRET
openssl rand -hex 32
```

### 6.3. Connection String Notes

**Neon (PostgreSQL):**
- Use the **pooled** connection string for better performance
- Ensure `?sslmode=require` is included
- Format: `postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/DATABASE?sslmode=require`

**Upstash (Redis):**
- Use `rediss://` (with double 's') for TLS
- Format: `rediss://default:PASSWORD@xxx.upstash.io:6379`

---

## 7. First Deployment

### 7.1. Update shopify.app.prod.toml

Verify `shopify.app.prod.toml` has correct values:

```toml
client_id = "eaca0ccfd74444b9f79cd7c0cc8e87be"
name = "Revenue Boost"
application_url = "https://revenue-boost.app/app"
embedded = true

[access_scopes]
scopes = "read_discounts,write_discounts,read_products,read_themes,read_orders,write_marketing_events,read_marketing_events,read_customers,write_customers,write_files"

[auth]
redirect_urls = [
  "https://revenue-boost.app/auth/callback",
  "https://revenue-boost.app/auth/shopify/callback",
  "https://revenue-boost.app/api/auth/callback"
]

[app_proxy]
url = "https://revenue-boost.app"
subpath = "revenue-boost"
prefix = "apps"
```

### 7.2. Deploy Backend

Option A: **Automatic** (push to main branch)
```bash
git push origin main
# Triggers: 🚀 Deploy to Production workflow
```

Option B: **Manual** (workflow dispatch)
1. Go to Actions → 🚀 Deploy to Production
2. Click "Run workflow"

### 7.3. Deploy Extensions

After backend deployment:
1. Go to Actions → 🧩 Deploy Shopify app & extensions to Production
2. Click "Run workflow"

Or it runs automatically after successful backend deploy.

### 7.4. Seed Database

After first deployment, seed templates:

```bash
curl -X POST https://revenue-boost.app/api/seed-templates
```

---

## 8. Post-Deployment Verification

### 8.1. Health Check

```bash
curl https://revenue-boost.app/api/health
```

### 8.2. Test OAuth Flow

1. Go to: `https://revenue-boost.app/api/auth?shop=YOUR-STORE.myshopify.com`
2. Complete OAuth flow
3. Verify app loads in Shopify admin

### 8.3. Test App Proxy

From an installed store:
```bash
curl https://YOUR-STORE.myshopify.com/apps/revenue-boost/api/health
```

### 8.4. Verify Sentry

1. Trigger a test error in the app
2. Check Sentry dashboard for the error
3. Verify source maps are working (readable stack traces)

---

## 9. Monitoring & Logs

### 9.1. View Cloud Run Logs

```bash
gcloud run services logs read revenueboost-prod --region=us-east1
```

### 9.2. Sentry Dashboard

- Errors: https://sentry.io/organizations/YOUR_ORG/issues/
- Performance: https://sentry.io/organizations/YOUR_ORG/performance/

### 9.3. Cloud Run Console

https://console.cloud.google.com/run/detail/us-east1/revenueboost-prod

### 9.4. Neon Dashboard

https://console.neon.tech - Monitor database connections, query performance

### 9.5. Upstash Dashboard

https://console.upstash.com - Monitor Redis usage, commands/sec

---

## 10. Rollback Procedure

### 10.1. Rollback to Previous Revision

```bash
# List revisions
gcloud run revisions list --service=revenueboost-prod --region=us-east1

# Route traffic to previous revision
gcloud run services update-traffic revenueboost-prod \
  --region=us-east1 \
  --to-revisions=revenueboost-prod-PREVIOUS_REVISION=100
```

### 10.2. Deploy Specific Git SHA

```bash
# In GitHub Actions, manually run workflow with specific SHA
# Or locally:
docker build -t us-east1-docker.pkg.dev/revenueboost-prod/revenueboost-prod/revenueboost-prod:SPECIFIC_SHA .
docker push us-east1-docker.pkg.dev/revenueboost-prod/revenueboost-prod/revenueboost-prod:SPECIFIC_SHA
gcloud run deploy revenueboost-prod --image=us-east1-docker.pkg.dev/revenueboost-prod/revenueboost-prod/revenueboost-prod:SPECIFIC_SHA --region=us-east1
```

---

## 11. Cost Estimates

| Service | Tier | Est. Monthly Cost |
|---------|------|-------------------|
| **Cloud Run** | 1-10 instances, 2 vCPU, 2GB | $20-100 |
| **Neon** | Free tier / Pro ($19+) | $0-25 |
| **Upstash** | Free tier / Pay-as-you-go | $0-10 |
| **Artifact Registry** | Storage | $1-5 |
| **Sentry** | Free tier / Team | $0-26 |
| **Total** | | **$20-170/month** |

### Free Tier Limits

**Neon Free:**
- 0.5 GB storage
- 1 project, 10 branches
- 191 compute hours/month

**Upstash Free:**
- 10,000 commands/day
- 256 MB storage

**Sentry Free:**
- 5,000 errors/month
- 10,000 performance units

*Upgrade to paid tiers as usage grows.*

---

## 12. Checklist Summary

### Before Deployment
- [ ] GCP project created with billing
- [ ] Cloud Run & Artifact Registry APIs enabled
- [ ] Artifact Registry repository created
- [ ] Neon database created
- [ ] Upstash Redis created
- [ ] GCP service account created with permissions
- [ ] Domain verified and DNS configured
- [ ] Shopify app created in Partner Dashboard
- [ ] Sentry project created
- [ ] All GitHub secrets configured

### After Deployment
- [ ] Health check passes
- [ ] OAuth flow works
- [ ] App proxy works
- [ ] Extensions deployed
- [ ] Database seeded with templates
- [ ] Sentry receiving errors
- [ ] Source maps working in Sentry
- [ ] Monitoring dashboards accessible
