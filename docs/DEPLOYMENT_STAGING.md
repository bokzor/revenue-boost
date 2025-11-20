## Staging Deployment Guide

This document describes how to deploy the Revenue Boost Shopify app to **staging**, aligned with the existing GitHub Actions workflow in `.github/workflows/deploy-staging.yml` and using **Shopify CLI app configurations**.

---

## 1. Environments Overview

- **Backend (staging)**
  - Google Cloud project: `splitpop-staging`
  - Region: `us-central1`
  - Cloud Run service: `split-pop-staging`
  - Docker repo: `us-central1-docker.pkg.dev/splitpop-staging/split-pop-staging/split-pop-staging`

- **Shopify (staging)**
  - Staging store: `revenue-boost-staging`
    - Admin URL: https://admin.shopify.com/store/revenue-boost-staging
  - Managed via **Shopify CLI app configurations** (use a `staging` configuration).

- **Workflow**
  - File: `.github/workflows/deploy-staging.yml`
  - Name: `🚀 Deploy to Staging`
  - Trigger: **manual** in GitHub UI (`workflow_dispatch`).

---

## 2. Required Secrets (GitHub Actions)

These secrets must be configured in the GitHub repository for staging deployment to work:

- `GCP_SA_KEY` – JSON key for the GCP service account used by the workflow.
- `DATABASE_URL` – Staging Postgres URL used by Prisma.
- `REDIS_URL` – Staging Redis URL (if used).
- `SESSION_SECRET` – Session secret for app sessions.
- `SHOPIFY_API_KEY` – API key for the **staging** Shopify app configuration.
- `SHOPIFY_API_SECRET` – API secret key for the **staging** Shopify app configuration.
- `SHOPIFY_CLI_PARTNERS_TOKEN` – CLI auth token from the Partner Dashboard, used by the **Deploy Shopify app & extensions to Staging** workflow.
- `INTERNAL_API_SECRET` – Shared secret for internal APIs.

> Note: At the moment, **GitHub Secrets are the source of truth** for staging configuration. Cloud Run environment variables are populated from these secrets by the workflow.

---

## 3. Shopify CLI App Configurations (Staging)

We use **Shopify CLI app configurations** to switch between environments.

### 3.1. Link app configuration (one-time)

From the project root:

<augment_code_snippet mode="EXCERPT">
````bash
npm run config:link
````
</augment_code_snippet>

Follow the prompts to link this repo to the Shopify app that should be used for **staging**, and create/select a `staging` configuration.

### 3.2. Use the staging configuration

Whenever you run Shopify CLI commands that should target staging (e.g. local tests or extension deploys):

<augment_code_snippet mode="EXCERPT">
````bash
npm run config:use
# Select: staging
````
</augment_code_snippet>

This ensures Shopify CLI uses the **staging app** and the **`revenue-boost-staging`** store.

---

## 4. Staging Deployment Workflow (What GitHub Does)

The `🚀 Deploy to Staging` workflow has two jobs: `test` and `deploy`.

### 4.1. Trigger and inputs

- Start the workflow manually from the **Actions** tab.
- Inputs:
  - `environment` (staging / production) – currently informational; the workflow is wired to **staging only**.
  - `skip_tests` (boolean, default `false`).

### 4.2. Tests and checks (`test` job)

Runs only when `skip_tests = false`:

1. Checkout repo.
2. Setup Node.js 20 with npm cache.
3. Install dependencies: `npm ci`.
4. Run unit tests: `npm run test --if-present`.
5. Type-check: `npm run typecheck`.
6. Lint: `npm run lint --if-present`.

The `deploy` job only runs if this job **succeeds** or is **skipped**.

### 4.3. Backend deployment (`deploy` job)

1. **Build**
   - `npm ci`
   - `npm run build`

2. **Authenticate & build image**
   - Auth to GCP using `GCP_SA_KEY`.
   - Configure Docker for Artifact Registry.
   - Build Docker image tagged with `${GITHUB_SHA}` and `latest`.
   - Push to `us-central1-docker.pkg.dev/splitpop-staging/split-pop-staging/split-pop-staging`.

3. **Deploy to Cloud Run**
   - Reads secrets (`DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `INTERNAL_API_SECRET`).
   - Generates `env_vars.yaml` including:
     - `NODE_ENV=production`
     - `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`
     - `SHOPIFY_APP_URL` (service URL or temporary placeholder on first deploy)
     - `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
     - `SCOPES` / `SHOPIFY_SCOPES`
     - `INTERNAL_API_SECRET`
   - Runs `gcloud run deploy split-pop-staging ... --env-vars-file env_vars.yaml`.

4. **Get service URL**
   - Calls `gcloud run services describe split-pop-staging` to capture the service URL.

5. **Seed templates & segments**
   - Polls `GET /api/health` until the service is ready.
   - Calls `POST /api/seed-templates` on the staging service.
   - Logs success or a non-fatal warning if templates were already seeded.

6. **Update `SHOPIFY_APP_URL` on first deploy**
   - If the current `SHOPIFY_APP_URL` is the temporary placeholder, regenerate `env_vars.yaml` with the **real** service URL and run:
     - `gcloud run services update split-pop-staging --env-vars-file env_vars.yaml`.

7. **Health check & summary**
   - Simple `GET /api/health` check.
   - Writes a deployment summary with the service URL to the GitHub Actions run summary.

---

## 5. Shopify App Configuration for Staging

After the **first** successful staging deployment (or any time the Cloud Run URL changes):

1. Go to the **staging** app in the Shopify Partner Dashboard.
2. In the app settings:
   - Set **App URL** to the Cloud Run URL shown in the deployment summary.
   - Set **Allowed redirection URL(s)** (e.g.):
     - `<CLOUD_RUN_URL>/auth/callback`
     - Any additional callback routes required by the app.
3. Ensure the app is installed on the `revenue-boost-staging` store.

The backend will already be using this URL as `SHOPIFY_APP_URL` via environment variables.

---

## 6. Shopify Extensions (Storefront Popup) and Staging

There are two ways to deploy the storefront popup extension to **staging**:

- **Recommended (CI)**: use the GitHub Actions workflow `🧩 Deploy Shopify app & extensions to Staging`.
- **Fallback (local/manual)**: use Shopify CLI from your machine.

### 6.1. Automated extension deployment via GitHub Actions

Workflow: `.github/workflows/deploy-extensions-staging.yml`

- Trigger it manually from the **Actions** tab: `🧩 Deploy Shopify app & extensions to Staging`.
- What it does:
  - Checks out the repo and sets up Node 20.
  - Runs `npm ci`.
  - Runs `npm run build:storefront` to build storefront assets.
  - Installs Shopify CLI (`@shopify/cli` and `@shopify/app`).
  - Runs `shopify app deploy --config staging --force --source-control-url <commit-url>`.
- Required GitHub secrets for this workflow:
  - `SHOPIFY_API_KEY` – Client ID for the **staging** Shopify app configuration.
  - `SHOPIFY_CLI_PARTNERS_TOKEN` – CLI auth token from the Partner Dashboard (org-level), exposed as an env var for Shopify CLI.
- `STAGING_APP_URL` – Base URL of the staging backend (Cloud Run URL or custom domain, for example `https://revenue-boost-staging.your-domain.com`).

This will deploy the **app configuration + all extensions**, including `extensions/storefront-popup/`, to the **staging** app configuration that targets the `revenue-boost-staging` store.

### 6.2. Manual extension deploy to staging (local)

If you need to deploy from your machine (for example, testing something quickly outside CI):

1. Switch Shopify CLI to the staging configuration:

<augment_code_snippet mode="EXCERPT">
````bash
npm run config:use
# Select: staging (targets revenue-boost-staging)
````
</augment_code_snippet>

2. Build storefront assets:

<augment_code_snippet mode="EXCERPT">
````bash
npm run build:storefront
````
</augment_code_snippet>

3. Deploy the app + extensions to the staging app:

<augment_code_snippet mode="EXCERPT">
````bash
npm run deploy
# or:
# shopify app deploy --config staging
````
</augment_code_snippet>

4. In the `revenue-boost-staging` store’s Theme Editor, enable/configure the `storefront-popup` theme app extension if it isnt already enabled.

