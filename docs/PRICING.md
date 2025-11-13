# Pricing Model

## Overview

This document describes the initial pricing model for the popup/banner/notification product, taking into account the full infrastructure stack:

- Neon Postgres
- Google Cloud Run
- Upstash Redis
- Built-in analytics and A/B testing

The core idea is:

- Externally: **simple monthly tiers per store**, based on **impressions/month**.
- Internally: we track **per‑impression cost** to ensure healthy margins and to adjust tiers over time.

## External Pricing (Merchant-Facing)

Plans are structured by **monthly widget impressions** (popups, banners, notifications) and feature set. All numbers are starting points and should be validated with market/competitor research and real usage data.

### Free

- **Price:** $0 / month
- **Impressions:** up to **5,000 / month**
- **Limits:**
  - 1 active campaign
  - Basic templates
  - Basic analytics (views, conversions)
  - "Powered by" branding
- **Goal:** frictionless onboarding, experimentation, and initial adoption.

### Starter

- **Price:** **$9 / month**
- **Impressions:** up to **25,000 / month**
- **Includes:**
  - Unlimited campaigns
  - All standard templates
  - Basic targeting (page URL, device, simple timing rules)
  - Basic analytics (CTR, signups/leads)
  - 1 ESP integration (e.g., Mailchimp/Klaviyo)

### Growth (Main Plan)

- **Price:** **$29 / month**
- **Impressions:** up to **100,000 / month**
- **Includes:**
  - Everything in Starter
  - A/B testing (variants per campaign)
  - Advanced targeting (UTM, traffic source, new vs returning visitors, etc.)
  - Multiple integrations (ESP + CRM + webhooks)
  - More detailed analytics (per‑campaign revenue uplift where possible)
  - Priority email support

### Pro

- **Price:** **$79 / month**
- **Impressions:** up to **400,000 / month**
- **Includes:**
  - Everything in Growth
  - Unlimited A/B tests
  - Advanced segments (buyers vs non‑buyers, high‑LTV segments, etc.)
  - Team features (multiple users, roles) – optional future
  - Higher limits on API calls and stored events
  - Faster support SLA (priority support)

### Scale / Enterprise

- **Starting price:** **$149+ / month** (custom)
- **Impressions:** **> 400,000 / month**
- **Billing options:**
  - Flat monthly fee with a high impressions cap (e.g., 1M+ impressions), or
  - Base fee + overage (e.g., $149 includes 400k impressions, then $X per extra 50k–100k impressions).
- **Includes:**
  - Everything in Pro
  - Custom SLAs and onboarding
  - Custom integrations
  - Optional outcome‑based elements (e.g., % of incremental revenue) for large merchants

## Internal Economics (Per‑Impression View)

Internally, we reason in terms of **cost per 100k impressions**, not exposed to merchants.

Rough order‑of‑magnitude (after free tiers, conservative):

- **Cloud Run:** ~ $0.05–$0.10 per 100k requests
- **Neon Postgres:** ~ $0.03–$0.07 per 100k light reads (plus base monthly DB cost)
- **Upstash Redis:** ~ $0.01–$0.02 per 100k operations
- **Other services (logging, analytics overhead):** small but non‑zero

For safety, we budget approximately:

> **≈ $1 per 100,000 impressions (all‑in buffer)**

This is intentionally conservative and should be updated once real usage and invoices are available.

### Example Margin Check

Using the buffer above:

- **Growth plan (100k impressions @ $29)**
  - Estimated infra: ~$1
  - Gross margin before dev/support: ~$28

- **Pro plan (400k impressions @ $79)**
  - Estimated infra: ~$4
  - Gross margin before dev/support: ~$75

Even if real infra costs are 5–10x higher than these estimates, margins remain strong. The main constraint becomes support and development time, not raw infrastructure.

## Why We Avoid Raw Per‑Display Pricing Publicly

We *do* track per‑display costs internally, but we do **not** expose billing like "$0.00X per popup display" to merchants because:

- It makes bills hard to predict (especially during big sales like Black Friday).
- It feels more like an ad network than a conversion tool.
- It adds cognitive friction (merchants must estimate impressions manually).

Instead, we:

- Offer **simple, predictable tiers** (Free, Starter, Growth, Pro, Enterprise).
- Communicate limits in terms of **monthly impressions** and highlight key features.
- Keep the internal cost model separate as an operational tool.

## Future Adjustments

This pricing is a **starting point** and should be revisited as we learn from:

- Real infra usage and costs per 100k impressions
- Merchant willingness to pay and plan distribution
- Competitive landscape (other Shopify apps in the same space)

Potential future levers:

- Adjust impression caps per tier (up or down)
- Introduce higher tiers between Pro and Enterprise
- Add optional outcome‑based pricing for very large merchants
- Gate new premium features (advanced analytics, experimentation tools) behind higher tiers.

