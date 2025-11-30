# Email Marketing Platform Integration Plan

## Revenue Boost × Email Marketing Platforms

**Document Version:** 2.0
**Created:** 2025-11-30
**Updated:** 2025-11-30
**Status:** Planning

---

## Table of Contents

### Active Plan
1. [Executive Summary](#1-executive-summary) - Key discovery & revised strategy
2. [Current System Analysis](#2-current-system-analysis) - How Shopify native sync already works
3. [Recommended Approach: Enhance Shopify Tags](#3-recommended-approach-enhance-shopify-tags) - **Primary implementation**
4. [Future: Direct API Integrations](#4-future-direct-api-integrations) - When to consider
5. [Mailchimp API Reference](#5-mailchimp-api-reference) - For future reference
6. [Klaviyo API Reference](#6-klaviyo-api-reference) - For future reference
7. [Implementation Roadmap](#7-implementation-roadmap) - **~1 week effort**
8. [Appendix: Removed Content](#8-appendix-removed-content) - Yotpo explanation
9. [Document History](#9-document-history)

### Archived Content (Direct Integration Details)
*Preserved for future reference if direct API integrations are needed.*

---

## 1. Executive Summary

### 1.1 Key Discovery

**Revenue Boost already syncs leads to email marketing platforms automatically!**

When a lead signs up via a popup, we create a Shopify Customer with:
- Email marketing consent (`SUBSCRIBED`)
- Tags for tracking (`source:revenue-boost-popup`, `campaign:{id}`)

Any email platform that syncs Shopify customers (Klaviyo, Mailchimp, Omnisend, etc.) will **automatically receive these leads** with no additional configuration.

### 1.2 Revised Strategy

| Phase | Approach | Effort | Status |
|-------|----------|--------|--------|
| **Phase 1** | Enhance Shopify tags for better tracking | Low | 🔜 Recommended |
| **Phase 2** | Document auto-sync for merchants | Low | 🔜 Recommended |
| **Phase 3** | Direct API integrations (if requested) | High | 📋 Future |

### 1.3 Why This Approach?

| Direct API Integrations | Shopify Native Sync |
|------------------------|---------------------|
| OAuth setup required | Zero configuration |
| Per-platform implementation | Works with ALL platforms |
| Maintenance burden | Shopify maintains sync |
| 6-7 weeks to build | Already working |
| Specific list targeting | Default sync behavior |

**Recommendation:** Focus on improving tags and documenting the auto-sync. Only build direct integrations if merchants specifically request features like list targeting.

---

## 2. Current System Analysis

### 2.1 ✅ What Already Works: Shopify Customer Sync

Revenue Boost **already creates Shopify Customers** when leads sign up:

```
Storefront Popup (Newsletter, Spin-to-Win, etc.)
       │
       ▼
POST /apps/revenue-boost/api/leads/submit
       │
       ├──► Validate lead data
       ├──► Create Lead record in database
       ├──► Issue discount code (if applicable)
       │
       ├──► 🔑 upsertCustomer() - CREATE SHOPIFY CUSTOMER
       │         │
       │         ├── email
       │         ├── firstName, lastName
       │         ├── emailMarketingConsent: SUBSCRIBED
       │         └── tags: ["source:revenue-boost-popup", "campaign:{id}"]
       │
       └──► Return success response
              │
              ▼
       Klaviyo/Mailchimp/Omnisend automatically syncs customer!
```

### 2.2 Key Code: Customer Upsert

**Location:** `app/lib/shopify/customer.server.ts`

```typescript
// When creating a customer, we set marketing consent
emailMarketingConsent: data.acceptsMarketing
  ? {
      marketingState: "SUBSCRIBED",
      marketingOptInLevel: "SINGLE_OPT_IN",
    }
  : undefined,
tags: data.tags || [],
```

**Location:** `app/routes/api.leads.submit.tsx`

```typescript
// Sanitize customer data
const customerData: CustomerUpsertData = sanitizeCustomerData({
  email: validatedData.email,
  firstName: validatedData.firstName,
  lastName: validatedData.lastName,
  phone: validatedData.phone,
  marketingConsent: validatedData.consent,
  source: "revenue-boost-popup",
  campaignId: validatedData.campaignId,
});

// Upsert customer in Shopify
const customerResult = await upsertCustomer(admin, customerData);
```

### 2.3 How Email Platforms Sync Shopify Customers

| Platform | Sync Method | What Gets Synced |
|----------|-------------|------------------|
| **Klaviyo** | Native Shopify app | All customers, orders, consent, tags |
| **Mailchimp** | Shopify integration | Customers with email consent |
| **Omnisend** | Native Shopify app | All customers, orders, tags |
| **Drip** | Shopify integration | Customers, orders |
| **Sendinblue/Brevo** | Shopify plugin | Customers with consent |

**Result:** When we create a Shopify Customer with `emailMarketingConsent: SUBSCRIBED`, these platforms automatically pick up the lead!

### 2.4 Current Tag Structure

Currently, we add these tags:
```typescript
tags: [
  `source:revenue-boost-popup`,
  `campaign:${campaignId}`,  // e.g., "campaign:clx123abc"
]
```

**Problem:** The campaign ID is not human-readable. Merchants can't easily segment by campaign in Klaviyo/Mailchimp.

---

## 3. Recommended Approach: Enhance Shopify Tags

### 3.1 Improved Tag Structure

Update the customer tagging to be more descriptive and segmentable:

```typescript
// Current (hard to use)
tags: [
  "source:revenue-boost-popup",
  "campaign:clx123abc",
]

// Proposed (easy to segment)
tags: [
  "revenue-boost",                    // Master tag
  "rb-popup",                         // Source type
  "rb-template:newsletter",           // Template type (newsletter, spin-to-win, etc.)
  "rb-campaign:summer-sale-2025",     // Slugified campaign name
  "rb-date:2025-01",                  // Month of signup (for cohort analysis)
]
```

### 3.2 Tag Naming Conventions

| Tag | Purpose | Example |
|-----|---------|---------|
| `revenue-boost` | Identifies all RB leads | `revenue-boost` |
| `rb-popup` | Source is a popup | `rb-popup` |
| `rb-template:{type}` | Template type | `rb-template:spin-to-win` |
| `rb-campaign:{slug}` | Campaign name (slugified) | `rb-campaign:black-friday-sale` |
| `rb-date:{YYYY-MM}` | Signup month | `rb-date:2025-01` |
| `rb-discount:{code}` | Discount received | `rb-discount:SAVE10` |

### 3.3 Implementation Changes

**File:** `app/lib/shopify/customer.server.ts`

```typescript
export function buildCustomerTags(data: {
  source?: string;
  campaignId?: string;
  campaignName?: string;
  templateType?: string;
  discountCode?: string;
}): string[] {
  const tags: string[] = ["revenue-boost"];

  if (data.source === "revenue-boost-popup") {
    tags.push("rb-popup");
  }

  if (data.templateType) {
    tags.push(`rb-template:${data.templateType.toLowerCase()}`);
  }

  if (data.campaignName) {
    const slug = slugify(data.campaignName);
    tags.push(`rb-campaign:${slug}`);
  }

  // Add month for cohort analysis
  const month = new Date().toISOString().slice(0, 7); // "2025-01"
  tags.push(`rb-date:${month}`);

  if (data.discountCode) {
    tags.push(`rb-discount:${data.discountCode}`);
  }

  return tags;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40); // Shopify tag limit
}
```

**File:** `app/routes/api.leads.submit.tsx`

```typescript
// Update customerData to include campaign name and template type
const customerData: CustomerUpsertData = sanitizeCustomerData({
  email: validatedData.email,
  firstName: validatedData.firstName,
  lastName: validatedData.lastName,
  phone: validatedData.phone,
  marketingConsent: validatedData.consent,
  source: "revenue-boost-popup",
  campaignId: validatedData.campaignId,
  campaignName: campaign.name,           // NEW
  templateType: campaign.templateType,    // NEW
  discountCode: discountResult.discountCode, // NEW
});
```

### 3.4 Merchant Benefits

With improved tags, merchants can easily segment in Klaviyo/Mailchimp:

| Segment | Tag Filter |
|---------|------------|
| All Revenue Boost leads | `revenue-boost` |
| Newsletter signups only | `rb-template:newsletter` |
| Spin-to-win players | `rb-template:spin-to-win` |
| Black Friday campaign | `rb-campaign:black-friday-sale` |
| January 2025 cohort | `rb-date:2025-01` |
| Got SAVE10 discount | `rb-discount:save10` |

### 3.5 Documentation for Merchants

Add to help docs or in-app guidance:

> **📧 Email Marketing Integration**
>
> Your popup leads are automatically synced to your email marketing platform!
>
> **How it works:**
> 1. When someone signs up via a Revenue Boost popup, we create a Shopify customer
> 2. Your email platform (Klaviyo, Mailchimp, etc.) automatically syncs Shopify customers
> 3. Use tags to segment your leads in your email platform
>
> **Available Tags:**
> - `revenue-boost` - All leads from Revenue Boost
> - `rb-template:newsletter` - Newsletter popup signups
> - `rb-template:spin-to-win` - Spin-to-win players
> - `rb-campaign:{name}` - Specific campaign name
>
> **No setup required!** If your email platform syncs Shopify customers, you're already set.

---

## 4. Future: Direct API Integrations

> ⚠️ **Note:** This section is for future reference. Direct integrations should only be built if merchants specifically request features not available through Shopify sync.

### 4.1 When Direct Integration Makes Sense

| Use Case | Shopify Sync | Direct Integration |
|----------|--------------|-------------------|
| Basic email sync | ✅ Works | Not needed |
| Custom properties | ❌ Limited | ✅ Full control |
| Specific list targeting | ❌ Default list only | ✅ Any list |
| SMS consent (Klaviyo) | ⚠️ Partial | ✅ Full control |
| Loyalty points (Yotpo) | ❌ Not supported | ✅ Required |

### 4.2 Potential Future Integrations

If merchant demand exists, consider:

1. **Klaviyo Direct** - For SMS consent and custom properties
2. **Mailchimp Direct** - For specific audience targeting
3. ~~**Yotpo**~~ - Removed (too niche, loyalty-focused, not email marketing)

---

## 5. Mailchimp API Reference

> 📋 **Reference only** - For future implementation if direct integration is needed.

### 5.1 Platform Overview

**Mailchimp** is one of the most widely-used email marketing platforms, offering:
- Email campaign management
- Audience/list management
- Marketing automation
- Transactional email (via Mandrill)

**Shopify Presence:** Native Mailchimp app available, but many merchants want leads from multiple sources synced.

### 3.2 Authentication

#### OAuth 2.0 Flow (Recommended)

Mailchimp uses standard OAuth 2.0 Authorization Code flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mailchimp OAuth Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Merchant clicks "Connect Mailchimp"                         │
│           │                                                     │
│           ▼                                                     │
│  2. Redirect to Mailchimp authorization URL:                    │
│     https://login.mailchimp.com/oauth2/authorize?               │
│       response_type=code&                                       │
│       client_id={MAILCHIMP_CLIENT_ID}&                          │
│       redirect_uri={APP_URL}/api/integrations/mailchimp/callback│
│           │                                                     │
│           ▼                                                     │
│  3. User logs in to Mailchimp, authorizes app                   │
│           │                                                     │
│           ▼                                                     │
│  4. Mailchimp redirects to callback with ?code={auth_code}      │
│           │                                                     │
│           ▼                                                     │
│  5. Server exchanges code for access_token:                     │
│     POST https://login.mailchimp.com/oauth2/token               │
│     Body: grant_type=authorization_code&                        │
│           client_id={ID}&client_secret={SECRET}&                │
│           redirect_uri={URI}&code={auth_code}                   │
│           │                                                     │
│           ▼                                                     │
│  6. Get data center from metadata endpoint:                     │
│     GET https://login.mailchimp.com/oauth2/metadata             │
│     Headers: Authorization: OAuth {access_token}                │
│     Response: { "dc": "us6", "login_url": "...", ... }          │
│           │                                                     │
│           ▼                                                     │
│  7. Store encrypted credentials:                                │
│     { accessToken, dataCenter: "us6" }                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Important Notes:**
- Mailchimp access tokens do NOT expire (no refresh token needed)
- Data center (dc) is required for all API calls - determines subdomain
- Token remains valid until user revokes access

#### Alternative: API Key Auth

For simpler implementations, merchants can provide their API key directly:
- Format: `{key}-{dc}` (e.g., `abc123def456-us6`)
- Less secure (key visible to merchant)
- Recommended only for testing

### 3.3 API Endpoints

**Base URL:** `https://{dc}.api.mailchimp.com/3.0`

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/lists` | GET | Fetch all audiences/lists | Standard |
| `/lists/{list_id}` | GET | Get specific list details | Standard |
| `/lists/{list_id}/members` | GET | List all members | Standard |
| `/lists/{list_id}/members` | POST | Add new subscriber | Standard |
| `/lists/{list_id}/members/{subscriber_hash}` | PUT | Update/upsert subscriber | Standard |
| `/lists/{list_id}/members/{subscriber_hash}` | PATCH | Partial update | Standard |
| `/lists/{list_id}/members/{subscriber_hash}/tags` | POST | Add/remove tags | Standard |
| `/lists/{list_id}/merge-fields` | GET | Get custom fields | Standard |
| `/lists/{list_id}/merge-fields` | POST | Create custom field | Standard |
| `/ping` | GET | Test connection | Standard |

**Subscriber Hash:** MD5 hash of lowercase email address
```javascript
const subscriberHash = crypto.createHash('md5')
  .update(email.toLowerCase())
  .digest('hex');
```

### 3.4 Rate Limits

| Limit Type | Value |
|------------|-------|
| Concurrent connections | 10 |
| Request timeout | 120 seconds |
| Batch operations | 500 per batch |

**No explicit requests-per-second limit**, but concurrent connection limit effectively throttles.

### 3.5 Request/Response Examples

#### Add Subscriber
```http
POST /3.0/lists/{list_id}/members
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "email_address": "user@example.com",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe",
    "PHONE": "+15005550006"
  },
  "tags": ["revenue-boost", "newsletter-popup"]
}
```

**Response (201 Created):**
```json
{
  "id": "abc123",
  "email_address": "user@example.com",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe",
    "PHONE": "+15005550006"
  },
  "tags": [
    { "id": 1, "name": "revenue-boost" },
    { "id": 2, "name": "newsletter-popup" }
  ],
  "list_id": "abc123def",
  "timestamp_signup": "2025-11-30T12:00:00+00:00"
}
```

#### Handle Existing Subscriber (Upsert)
```http
PUT /3.0/lists/{list_id}/members/{subscriber_hash}
Content-Type: application/json

{
  "email_address": "user@example.com",
  "status_if_new": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "DISCOUNT": "SAVE10"
  }
}
```

### 3.6 Field Mapping

| Revenue Boost Field | Mailchimp Field | Notes |
|---------------------|-----------------|-------|
| `lead.email` | `email_address` | Required |
| `lead.firstName` | `merge_fields.FNAME` | Default merge field |
| `lead.lastName` | `merge_fields.LNAME` | Default merge field |
| `lead.phone` | `merge_fields.PHONE` | May need to create field |
| `lead.discountCode` | `merge_fields.DISCOUNT` | Custom field - create if needed |
| `lead.marketingConsent` | `status` | "subscribed" or "pending" |
| `campaign.name` | Tag | `campaign-{slug}` |
| `campaign.templateType` | Tag | `template-{type}` |
| `store.shopifyDomain` | Tag | `store-{domain}` |

### 5.7 Error Codes

| HTTP Status | Error Title | Cause | Action |
|-------------|-------------|-------|--------|
| 400 | "Invalid Resource" | Malformed request | Check field values |
| 400 | "Member Exists" | Email already subscribed | Use PUT for upsert |
| 401 | "API Key Invalid" | Bad/revoked token | Prompt reconnect |
| 403 | "Forbidden" | Insufficient permissions | Check OAuth scopes |
| 404 | "Resource Not Found" | List doesn't exist | Prompt list selection |
| 429 | "Too Many Requests" | Rate limited | Retry after delay |
| 500 | "Internal Server Error" | Mailchimp issue | Retry with backoff |

### 5.8 Configuration Schema

```typescript
// Mailchimp-specific integration config
interface MailchimpConfig {
  // Selected audience
  listId: string;
  listName: string;

  // Sync options
  syncEnabled: boolean;
  addTags: boolean;
  tagPrefix: string;  // e.g., "rb-" for "rb-newsletter-popup"

  // Field mapping
  includeFirstName: boolean;
  includeLastName: boolean;
  includePhone: boolean;
  includeDiscountCode: boolean;
  discountFieldName: string;  // Merge field name for discount

  // Double opt-in
  useDoubleOptIn: boolean;  // Set status to "pending" instead of "subscribed"
}
```

---

## 6. Klaviyo API Reference

> 📋 **Reference only** - For future implementation if direct integration is needed.

### 6.1 Platform Overview

**Klaviyo** is the leading email/SMS marketing platform for e-commerce, with:
- Deep Shopify integration (native app)
- Unified email + SMS marketing
- Advanced segmentation and flows
- Rich customer profiles with purchase history

**Shopify Presence:** Most popular email platform among Shopify merchants. Native integration syncs customers and orders automatically.

**Key Advantage for Revenue Boost:** Leads sync as Klaviyo profiles that automatically link to Shopify customer records.

### 4.2 Authentication

#### OAuth 2.0 Flow (Recommended for Apps)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Klaviyo OAuth Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Merchant clicks "Connect Klaviyo"                           │
│           │                                                     │
│           ▼                                                     │
│  2. Redirect to Klaviyo authorization URL:                      │
│     https://www.klaviyo.com/oauth/authorize?                    │
│       client_id={KLAVIYO_CLIENT_ID}&                            │
│       redirect_uri={CALLBACK_URI}&                              │
│       response_type=code&                                       │
│       scope=profiles:write lists:write lists:read               │
│             subscriptions:write                                 │
│           │                                                     │
│           ▼                                                     │
│  3. User logs in to Klaviyo, authorizes app                     │
│           │                                                     │
│           ▼                                                     │
│  4. Klaviyo redirects to callback with ?code={auth_code}        │
│           │                                                     │
│           ▼                                                     │
│  5. Server exchanges code for tokens:                           │
│     POST https://a.klaviyo.com/oauth/token                      │
│     Body: grant_type=authorization_code&                        │
│           client_id={ID}&client_secret={SECRET}&                │
│           redirect_uri={URI}&code={auth_code}                   │
│           │                                                     │
│           ▼                                                     │
│  6. Store encrypted credentials:                                │
│     { accessToken, refreshToken, expiresAt }                    │
│                                                                 │
│  Note: Klaviyo tokens expire - refresh flow required            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Required OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `profiles:write` | Create and update customer profiles |
| `lists:read` | Fetch available lists for selection |
| `lists:write` | Add profiles to lists |
| `subscriptions:write` | Manage email/SMS subscription status |

#### Token Refresh Flow

Klaviyo access tokens expire. Implement refresh:

```typescript
async function refreshKlaviyoToken(integration: Integration): Promise<string> {
  const credentials = await decryptCredentials(integration.credentials);

  if (Date.now() < credentials.expiresAt - 300000) {
    // Token still valid (with 5 min buffer)
    return credentials.accessToken;
  }

  const response = await fetch('https://a.klaviyo.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
      client_id: process.env.KLAVIYO_CLIENT_ID!,
      client_secret: process.env.KLAVIYO_CLIENT_SECRET!,
    }),
  });

  const tokens = await response.json();

  // Update stored credentials
  await updateIntegrationCredentials(integration.id, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
  });

  return tokens.access_token;
}
```

### 4.3 API Endpoints

**Base URL:** `https://a.klaviyo.com/api`

**Required Header:** `revision: 2024-10-15` (API version)

| Endpoint | Method | Purpose | Rate Limit Tier |
|----------|--------|---------|-----------------|
| `/lists` | GET | Fetch all lists | M |
| `/profiles` | POST | Create profile | M |
| `/profiles/{id}` | PATCH | Update profile | M |
| `/profile-subscription-bulk-create-jobs` | POST | Subscribe profiles to list | M |
| `/events` | POST | Track custom events | L |

**Rate Limit Tiers:**

| Tier | Burst (1s) | Steady (1min) |
|------|------------|---------------|
| XS | 1 | 15 |
| S | 3 | 60 |
| M | 10 | 150 |
| L | 75 | 700 |
| XL | 350 | 3500 |

### 4.4 Request/Response Examples

#### Subscribe Profile to List (Recommended Endpoint)

```http
POST /api/profile-subscription-bulk-create-jobs
Content-Type: application/json
Authorization: Klaviyo-API-Key {access_token}
revision: 2024-10-15

{
  "data": {
    "type": "profile-subscription-bulk-create-job",
    "attributes": {
      "profiles": {
        "data": [
          {
            "type": "profile",
            "attributes": {
              "email": "user@example.com",
              "phone_number": "+15005550006",
              "first_name": "John",
              "last_name": "Doe",
              "properties": {
                "revenue_boost_source": "newsletter-popup",
                "revenue_boost_campaign_id": "cuid123",
                "revenue_boost_campaign_name": "Summer Sale Popup",
                "discount_code_received": "SAVE10",
                "signup_page_url": "https://store.myshopify.com/products/widget"
              },
              "subscriptions": {
                "email": {
                  "marketing": {
                    "consent": "SUBSCRIBED",
                    "consented_at": "2025-11-30T12:00:00Z"
                  }
                }
              }
            }
          }
        ]
      }
    },
    "relationships": {
      "list": {
        "data": {
          "type": "list",
          "id": "WxYz12"
        }
      }
    }
  }
}
```

**Response (202 Accepted):**
```json
{
  "data": {
    "type": "profile-subscription-bulk-create-job",
    "id": "job-abc-123",
    "attributes": {
      "status": "queued",
      "created_at": "2025-11-30T12:00:00Z",
      "total_count": 1,
      "completed_count": 0,
      "failed_count": 0
    }
  }
}
```

#### With SMS Subscription

```json
{
  "subscriptions": {
    "email": {
      "marketing": {
        "consent": "SUBSCRIBED",
        "consented_at": "2025-11-30T12:00:00Z"
      }
    },
    "sms": {
      "marketing": {
        "consent": "SUBSCRIBED",
        "consented_at": "2025-11-30T12:00:00Z"
      }
    }
  }
}
```

**SMS Requirements:**
- Phone must be E.164 format: `+15005550006`
- SMS consent must be explicitly captured
- If age-gating enabled: `age_gated_date_of_birth` required

### 4.5 Field Mapping

| Revenue Boost Field | Klaviyo Field | Notes |
|---------------------|---------------|-------|
| `lead.email` | `attributes.email` | Required |
| `lead.firstName` | `attributes.first_name` | Standard field |
| `lead.lastName` | `attributes.last_name` | Standard field |
| `lead.phone` | `attributes.phone_number` | E.164 format |
| `lead.discountCode` | `properties.discount_code_received` | Custom property |
| `lead.marketingConsent` | `subscriptions.email.marketing.consent` | SUBSCRIBED/UNSUBSCRIBED |
| `lead.smsConsent` | `subscriptions.sms.marketing.consent` | Separate consent |
| `campaign.id` | `properties.revenue_boost_campaign_id` | Custom property |
| `campaign.name` | `properties.revenue_boost_campaign_name` | Custom property |
| `campaign.templateType` | `properties.revenue_boost_source` | Custom property |
| Page URL | `properties.signup_page_url` | Where they signed up |

### 4.6 Error Handling

| HTTP Status | Error Code | Cause | Action |
|-------------|------------|-------|--------|
| 400 | `invalid` | Malformed request | Check field formats |
| 401 | `not_authenticated` | Invalid/expired token | Refresh or reconnect |
| 403 | `permission_denied` | Missing scopes | Re-authorize with scopes |
| 404 | `not_found` | List doesn't exist | Prompt list selection |
| 409 | `conflict` | Duplicate in batch | Profile already exists |
| 429 | `throttled` | Rate limited | Use `Retry-After` header |

**Rate Limit Headers:**
```
RateLimit-Limit: 150
RateLimit-Remaining: 147
RateLimit-Reset: 45
```

### 4.7 Configuration Schema

```typescript
interface KlaviyoConfig {
  // Selected list
  listId: string;
  listName: string;

  // Email sync
  syncEmailEnabled: boolean;

  // SMS sync
  syncSmsEnabled: boolean;
  smsConsentRequired: boolean;  // Only sync SMS if explicit consent

  // Properties
  includeDiscountCode: boolean;
  includeCampaignInfo: boolean;
  includeSignupUrl: boolean;

  // Custom event tracking
  trackSignupEvent: boolean;
  eventName: string;  // Default: "Revenue Boost Signup"
}
```

---

## 7. Implementation Roadmap

### 7.1 Phase 1: Enhance Shopify Tags (Recommended - 1 week)

**Priority:** High
**Effort:** Low
**Impact:** Immediate value for all merchants

**Tasks:**

- [ ] Update `buildCustomerTags()` function with new tag structure
- [ ] Add campaign name and template type to customer data
- [ ] Update lead submission to pass additional data
- [ ] Add slugify utility function
- [ ] Test tag sync with Klaviyo/Mailchimp
- [ ] Update documentation for merchants

**Files to Modify:**
- `app/lib/shopify/customer.server.ts`
- `app/routes/api.leads.submit.tsx`
- `app/routes/apps.revenue-boost.api.leads.submit.tsx`

### 7.2 Phase 2: Merchant Documentation (1-2 days)

**Tasks:**

- [ ] Add "Email Integration" section to help docs
- [ ] Create in-app tooltip explaining auto-sync
- [ ] Document available tags for segmentation
- [ ] Add FAQ: "How do I sync leads to Klaviyo/Mailchimp?"

### 7.3 Phase 3: Direct Integrations (Future - If Requested)

**Trigger:** Merchant feedback requesting:
- Specific list/audience targeting
- Custom profile properties
- SMS consent management (Klaviyo)

**Estimated Effort:** 4-6 weeks for Klaviyo + Mailchimp

**Decision Point:** Revisit after 3 months based on support requests.

---

## 8. Appendix: Removed Content

### 8.1 Yotpo Integration (Removed)

**Reason for Removal:**

Yotpo was removed from the integration plan because:

1. **Not an email marketing platform** - Yotpo focuses on reviews, loyalty, and UGC
2. **Narrow use case** - Only useful for merchants with Yotpo Loyalty active
3. **Lower demand** - Most merchants use Klaviyo/Mailchimp for email + Yotpo for reviews
4. **No Shopify customer sync benefit** - Loyalty enrollment requires direct API

**Future Consideration:** If merchants specifically request loyalty program enrollment via popups, Yotpo integration could be reconsidered.

---

## 9. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-30 | - | Initial document with full Mailchimp, Klaviyo, Yotpo plans |
| 2.0 | 2025-11-30 | - | Revised strategy: focus on Shopify native sync, deprioritize direct integrations, remove Yotpo |

---

*End of Document*

---
---
---

# ARCHIVED CONTENT

> The following sections are preserved for reference if direct API integrations are needed in the future.
> They are not part of the current implementation plan.

## A1. Yotpo API Reference (Archived)

### A1.1 Request/Response Examples

#### Create/Update Customer

```http
POST https://loyalty.yotpo.com/api/v2/customers
x-guid: abc123def456
x-api-key: xyz789...
Content-Type: application/json

{
  "customer": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+15005550006",
    "tags": "revenue-boost,newsletter-signup",
    "customer_external_id": "shopify_12345678"
  }
}
```

**Response (200 OK):**
```json
{
  "customer": {
    "id": 98765,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "points_balance": 0,
    "points_earned": 0,
    "vip_tier": null,
    "created_at": "2025-11-30T12:00:00Z"
  }
}
```

#### Award Points for Signup

```http
POST https://loyalty.yotpo.com/api/v2/actions
x-guid: abc123def456
x-api-key: xyz789...
Content-Type: application/json

{
  "customer_email": "user@example.com",
  "action_type": "custom_action",
  "action_id": "newsletter_signup"
}
```

**Response (200 OK):**
```json
{
  "action": {
    "id": 12345,
    "action_type": "custom_action",
    "points_earned": 50,
    "customer": {
      "email": "user@example.com",
      "points_balance": 50
    }
  }
}
```

**Note:** The `action_id` must be pre-configured in Yotpo's loyalty campaign settings.

### 5.5 Field Mapping

| Revenue Boost Field | Yotpo Field | Notes |
|---------------------|-------------|-------|
| `lead.email` | `customer.email` | Required |
| `lead.firstName` | `customer.first_name` | Optional |
| `lead.lastName` | `customer.last_name` | Optional |
| `lead.phone` | `customer.phone_number` | E.164 format |
| Shopify Customer ID | `customer.customer_external_id` | Links to Shopify |
| Campaign tags | `customer.tags` | Comma-separated |

### 5.6 SMSBump Integration

Yotpo acquired SMSBump for SMS marketing. Integration options:

1. **Via Loyalty Customer Sync:** Customer created in loyalty → available in SMSBump
2. **Direct SMSBump API:** Separate API (different credentials)

**Recommendation:** Start with Loyalty API only. SMSBump can be added later.

### 5.7 Configuration Schema

```typescript
interface YotpoConfig {
  // Connection
  guid: string;       // Store ID
  apiKey: string;     // API Key (encrypted)

  // Features
  enrollInLoyalty: boolean;
  awardSignupPoints: boolean;
  signupActionId: string;  // Custom action ID in Yotpo
  pointsAmount: number;    // Points to award (if not using action)

  // Customer sync
  includePhone: boolean;
  includeTags: boolean;
  tagPrefix: string;       // e.g., "rb-"

  // SMSBump (future)
  smsBumpEnabled: boolean;
}
```

### 5.8 Prerequisites for Merchants

To use Yotpo integration, merchants must:

1. ✅ Have Yotpo Loyalty installed and configured
2. ✅ Have an active loyalty campaign
3. ✅ (Optional) Create "Newsletter Signup" custom action in Yotpo
4. ✅ Copy GUID and API Key from Yotpo settings

---

## A2. Shared Infrastructure (Archived - For Direct Integrations)

### A2.1 Directory Structure

```
app/domains/integrations/
├── index.ts                          # Barrel exports
├── types/
│   ├── integration.ts                # Shared types and schemas
│   ├── providers.ts                  # Provider enums and metadata
│   ├── mailchimp.ts                  # Mailchimp config schema
│   ├── klaviyo.ts                    # Klaviyo config schema
│   └── yotpo.ts                      # Yotpo config schema
├── services/
│   ├── base-integration.server.ts    # Abstract base class
│   ├── sync-orchestrator.server.ts   # Coordinates multi-provider sync
│   ├── mailchimp.server.ts           # Mailchimp implementation
│   ├── klaviyo.server.ts             # Klaviyo implementation
│   └── yotpo.server.ts               # Yotpo implementation
├── components/
│   ├── IntegrationsSection.tsx       # Main settings section
│   ├── IntegrationCard.tsx           # Per-provider card
│   ├── ConnectionStatus.tsx          # Status badge/indicator
│   ├── SyncLogTable.tsx              # Recent sync history
│   ├── MailchimpSettings.tsx         # Mailchimp config form
│   ├── KlaviyoSettings.tsx           # Klaviyo config form
│   └── YotpoSettings.tsx             # Yotpo config form
└── utils/
    ├── encryption.server.ts          # Credential encryption
    ├── retry.server.ts               # Retry logic with backoff
    └── phone-format.server.ts        # E.164 phone formatting
```

### 6.2 Base Integration Service

```typescript
// app/domains/integrations/services/base-integration.server.ts

import type { Integration, Prisma } from "@prisma/client";
import type { LeadSyncPayload, SyncResult, ProviderList } from "../types/integration";

export abstract class BaseIntegrationService {
  abstract readonly providerId: IntegrationProvider;
  abstract readonly providerName: string;

  /**
   * Test if credentials are valid
   */
  abstract testConnection(credentials: unknown): Promise<{
    success: boolean;
    error?: string;
    accountInfo?: { name: string; email?: string };
  }>;

  /**
   * Fetch available lists/audiences for selection
   */
  abstract fetchLists(credentials: unknown): Promise<ProviderList[]>;

  /**
   * Sync a single lead to the provider
   */
  abstract syncLead(
    payload: LeadSyncPayload,
    config: unknown,
    credentials: unknown
  ): Promise<SyncResult>;

  /**
   * Refresh OAuth token if needed (optional)
   */
  async refreshTokenIfNeeded?(
    integration: Integration
  ): Promise<{ accessToken: string; updated: boolean }>;
}
```

### 6.3 Sync Orchestrator

```typescript
// app/domains/integrations/services/sync-orchestrator.server.ts

import prisma from "~/db.server";
import { decryptCredentials } from "../utils/encryption.server";
import { getServiceForProvider } from "./index.server";
import type { LeadSyncPayload } from "../types/integration";

export class SyncOrchestrator {
  /**
   * Called from lead submission endpoints after lead is created
   */
  static async syncLeadToAllProviders(payload: LeadSyncPayload): Promise<void> {
    const { store } = payload;

    // Find all enabled integrations for this store
    const integrations = await prisma.integration.findMany({
      where: {
        storeId: store.id,
        isEnabled: true,
      },
    });

    if (integrations.length === 0) {
      return; // No integrations configured
    }

    // Sync to each provider (fire and forget with logging)
    const syncPromises = integrations.map((integration) =>
      this.syncToProvider(integration, payload).catch((error) => {
        console.error(`[Sync] Failed to sync to ${integration.provider}:`, error);
      })
    );

    // Don't block the response - sync happens async
    Promise.allSettled(syncPromises);
  }

  private static async syncToProvider(
    integration: Integration,
    payload: LeadSyncPayload
  ): Promise<void> {
    const service = getServiceForProvider(integration.provider);
    const credentials = await decryptCredentials(integration.credentials);

    // Refresh token if OAuth provider
    if (service.refreshTokenIfNeeded) {
      const { accessToken, updated } = await service.refreshTokenIfNeeded(integration);
      if (updated) {
        credentials.accessToken = accessToken;
      }
    }

    const startTime = Date.now();
    let result;

    try {
      result = await service.syncLead(payload, integration.config, credentials);
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        retryable: true,
      };
    }

    const duration = Date.now() - startTime;

    // Log the sync attempt
    await prisma.integrationSyncLog.create({
      data: {
        integrationId: integration.id,
        leadId: payload.lead.email, // Using email as lead identifier
        campaignId: payload.campaign.id,
        action: "SUBSCRIBE",
        status: result.success ? "SUCCESS" : "FAILED",
        errorMessage: result.error,
        responseData: result.providerId ? { providerId: result.providerId, duration } : { duration },
      },
    });

    // Update integration status
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.success ? "SUCCESS" : "FAILED",
        lastSyncError: result.success ? null : result.error,
      },
    });
  }

  /**
   * Manual bulk sync of historical leads
   */
  static async syncHistoricalLeads(
    integrationId: string,
    fromDate?: Date
  ): Promise<{ synced: number; failed: number }> {
    // Implementation for bulk historical sync
    // Queue-based for large datasets
    throw new Error("Not implemented");
  }
}
```

### 6.4 Lead Sync Payload Type

```typescript
// app/domains/integrations/types/integration.ts

import { z } from "zod";

export const LeadSyncPayloadSchema = z.object({
  lead: z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    marketingConsent: z.boolean(),
    smsConsent: z.boolean().optional(),
    discountCode: z.string().optional(),
  }),
  campaign: z.object({
    id: z.string(),
    name: z.string(),
    templateType: z.string(),
  }),
  store: z.object({
    id: z.string(),
    shopifyDomain: z.string(),
  }),
  metadata: z.object({
    pageUrl: z.string().optional(),
    timestamp: z.string().datetime(),
    shopifyCustomerId: z.string().optional(),
  }).optional(),
});

export type LeadSyncPayload = z.infer<typeof LeadSyncPayloadSchema>;

export interface SyncResult {
  success: boolean;
  providerId?: string;  // ID in external system (e.g., Mailchimp member ID)
  error?: string;
  retryable?: boolean;
  rateLimited?: boolean;
  retryAfter?: number;  // Seconds to wait before retry
}

export interface ProviderList {
  id: string;
  name: string;
  memberCount?: number;
}
```

---

## A3. Database Schema (Archived) Changes

### 7.1 New Models

Add to `prisma/schema.prisma`:

```prisma
// ============================================================================
// INTEGRATIONS
// ============================================================================

model Integration {
  id              String              @id @default(cuid())
  storeId         String
  provider        IntegrationProvider
  isEnabled       Boolean             @default(true)

  // Encrypted OAuth tokens or API keys
  // Structure varies by provider:
  // Mailchimp: { accessToken, dataCenter }
  // Klaviyo:   { accessToken, refreshToken, expiresAt }
  // Yotpo:     { guid, apiKey }
  credentials     String              // Encrypted JSON string

  // Provider-specific configuration
  // Structure varies by provider (see config schemas)
  config          Json                @default("{}")

  // Sync status tracking
  lastSyncAt      DateTime?
  lastSyncStatus  SyncStatus          @default(NEVER_SYNCED)
  lastSyncError   String?

  // Metadata
  connectedAt     DateTime            @default(now())
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Relations
  store           Store               @relation(fields: [storeId], references: [id], onDelete: Cascade)
  syncLogs        IntegrationSyncLog[]

  // Constraints
  @@unique([storeId, provider])  // One integration per provider per store
  @@index([storeId, isEnabled])
  @@map("integrations")
}

model IntegrationSyncLog {
  id              String              @id @default(cuid())
  integrationId   String

  // What was synced
  leadId          String?             // Email or internal lead ID
  campaignId      String?

  // Sync details
  action          SyncAction
  status          SyncStatus
  errorMessage    String?
  responseData    Json?               // Provider response for debugging

  // Timing
  createdAt       DateTime            @default(now())

  // Relations
  integration     Integration         @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@index([integrationId, createdAt])
  @@index([leadId])
  @@index([campaignId])
  @@map("integration_sync_logs")
}

// Enums
enum IntegrationProvider {
  MAILCHIMP
  KLAVIYO
  YOTPO
}

enum SyncStatus {
  NEVER_SYNCED
  SUCCESS
  FAILED
  PENDING
  RATE_LIMITED
}

enum SyncAction {
  SUBSCRIBE
  UPDATE
  TAG
  UNSUBSCRIBE
  AWARD_POINTS  // Yotpo-specific
}
```

### 7.2 Store Model Update

Add relation to existing Store model:

```prisma
model Store {
  // ... existing fields ...

  // Add relation
  integrations    Integration[]
}
```

### 7.3 Migration Plan

```bash
# 1. Create migration
npx prisma migrate dev --name add_integrations

# 2. Verify migration
npx prisma migrate status

# 3. Generate client
npx prisma generate
```

### 7.4 Indexes and Performance

The schema includes:
- Unique constraint on `[storeId, provider]` - prevents duplicate integrations
- Index on `[storeId, isEnabled]` - fast lookup of active integrations
- Index on `[integrationId, createdAt]` - efficient log queries
- Index on `leadId` and `campaignId` - correlation analysis

---

## A4. API Routes (Archived)

### 8.1 New Routes Required

```
app/routes/
├── api.integrations.$provider.callback.tsx    # OAuth callback handler
├── api.integrations.$provider.connect.tsx     # Initiate OAuth or save API key
├── api.integrations.$provider.disconnect.tsx  # Remove integration
├── api.integrations.$provider.test.tsx        # Test connection
├── api.integrations.$provider.lists.tsx       # Fetch available lists
├── api.integrations.$provider.sync.tsx        # Manual sync trigger
└── api.integrations.$provider.logs.tsx        # Get sync logs
```

### 8.2 OAuth Callback Handler

```typescript
// app/routes/api.integrations.$provider.callback.tsx

import { type LoaderFunctionArgs, redirect } from "react-router";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { encryptCredentials } from "~/domains/integrations/utils/encryption.server";
import { getOAuthHandler } from "~/domains/integrations/services/oauth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { provider } = params;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return redirect(`/app/settings?integration_error=${error}`);
  }

  if (!code) {
    return redirect("/app/settings?integration_error=no_code");
  }

  try {
    const oauthHandler = getOAuthHandler(provider as IntegrationProvider);
    const credentials = await oauthHandler.exchangeCode(code);

    // Get store
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: session.shop },
    });

    if (!store) {
      return redirect("/app/settings?integration_error=store_not_found");
    }

    // Encrypt and store credentials
    const encryptedCredentials = encryptCredentials(credentials);

    await prisma.integration.upsert({
      where: {
        storeId_provider: {
          storeId: store.id,
          provider: provider.toUpperCase() as IntegrationProvider,
        },
      },
      create: {
        storeId: store.id,
        provider: provider.toUpperCase() as IntegrationProvider,
        credentials: encryptedCredentials,
        isEnabled: true,
      },
      update: {
        credentials: encryptedCredentials,
        isEnabled: true,
        connectedAt: new Date(),
      },
    });

    return redirect(`/app/settings?integration_success=${provider}`);
  } catch (error) {
    console.error(`[OAuth] ${provider} callback error:`, error);
    return redirect(`/app/settings?integration_error=oauth_failed`);
  }
}
```

### 8.3 Connect Endpoint

```typescript
// app/routes/api.integrations.$provider.connect.tsx

import { type ActionFunctionArgs, redirect, json } from "react-router";
import { authenticate } from "~/shopify.server";
import { getOAuthHandler } from "~/domains/integrations/services/oauth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { provider } = params;

  const formData = await request.formData();
  const authType = formData.get("authType"); // "oauth" or "apikey"

  if (authType === "oauth") {
    // Initiate OAuth flow
    const oauthHandler = getOAuthHandler(provider as IntegrationProvider);
    const authUrl = oauthHandler.getAuthorizationUrl(session.shop);
    return redirect(authUrl);
  }

  if (authType === "apikey") {
    // Handle API key submission (Yotpo)
    const guid = formData.get("guid") as string;
    const apiKey = formData.get("apiKey") as string;

    // Validate and store...
    // (implementation details)

    return json({ success: true });
  }

  return json({ error: "Invalid auth type" }, { status: 400 });
}
```

### 8.4 Fetch Lists Endpoint

```typescript
// app/routes/api.integrations.$provider.lists.tsx

import { type LoaderFunctionArgs, json } from "react-router";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { decryptCredentials } from "~/domains/integrations/utils/encryption.server";
import { getServiceForProvider } from "~/domains/integrations/services/index.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { provider } = params;

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
    include: {
      integrations: {
        where: { provider: provider.toUpperCase() as IntegrationProvider },
      },
    },
  });

  const integration = store?.integrations[0];
  if (!integration) {
    return json({ error: "Integration not found" }, { status: 404 });
  }

  const credentials = await decryptCredentials(integration.credentials);
  const service = getServiceForProvider(integration.provider);

  const lists = await service.fetchLists(credentials);

  return json({ lists });
}
```

---

## A5. UI/UX Requirements

### 9.1 Settings Page Integration

Add new section/tab to `app/routes/app.settings.tsx`:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌──────────┬─────────────────┬─────────────┬──────────────────────┐ │
│ │ Billing  │ Frequency Caps  │ Custom CSS  │ ✨ Integrations      │ │
│ └──────────┴─────────────────┴─────────────┴──────────────────────┘ │
│                                                                     │
│                      INTEGRATIONS TAB CONTENT                       │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  Sync your leads automatically to your email marketing        │  │
│  │  platforms. When visitors sign up through your popups,        │  │
│  │  they'll be added to your connected services.                 │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🐒 Mailchimp                             [Connected ✓]        │  │
│  │                                                               │  │
│  │ Audience: [My Newsletter ▾]                                   │  │
│  │                                                               │  │
│  │ ☑ Sync new leads automatically                                │  │
│  │ ☑ Add campaign name as tag                                    │  │
│  │ ☑ Include discount codes                                      │  │
│  │                                                               │  │
│  │ Last synced: 5 mins ago • 1,234 synced                        │  │
│  │                                                               │  │
│  │ [Sync Now]  [View Logs]  [Disconnect]                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 📧 Klaviyo                               [Connect →]          │  │
│  │                                                               │  │
│  │ Connect your Klaviyo account to sync email and SMS            │  │
│  │ subscribers from your popup campaigns.                        │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ⭐ Yotpo                                 [Connect →]          │  │
│  │                                                               │  │
│  │ Enroll new subscribers in your loyalty program and           │  │
│  │ award points for newsletter signups.                          │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Component Hierarchy

```
IntegrationsSection
├── IntegrationsDescription (info banner)
├── IntegrationCard (Mailchimp)
│   ├── ProviderLogo
│   ├── ConnectionStatus (badge)
│   ├── ConnectButton OR SettingsPanel
│   │   ├── ListSelector
│   │   ├── SyncOptions (checkboxes)
│   │   └── ActionButtons
│   └── SyncStatusFooter
├── IntegrationCard (Klaviyo)
│   └── ...
└── IntegrationCard (Yotpo)
    └── ...
```

### 9.3 Integration Card States

#### Disconnected State
```tsx
<Card>
  <InlineStack align="space-between">
    <InlineStack gap="300">
      <ProviderLogo provider="mailchimp" />
      <BlockStack gap="100">
        <Text variant="headingMd">Mailchimp</Text>
        <Text tone="subdued">
          Sync leads to your Mailchimp audiences
        </Text>
      </BlockStack>
    </InlineStack>
    <Button onClick={handleConnect}>Connect</Button>
  </InlineStack>
</Card>
```

#### Connected State
```tsx
<Card>
  <BlockStack gap="400">
    <InlineStack align="space-between">
      <InlineStack gap="300">
        <ProviderLogo provider="mailchimp" />
        <BlockStack gap="100">
          <Text variant="headingMd">Mailchimp</Text>
          <Badge tone="success">Connected</Badge>
        </BlockStack>
      </InlineStack>
      <Button tone="critical" variant="plain" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </InlineStack>

    <Select
      label="Audience"
      options={lists}
      value={selectedList}
      onChange={handleListChange}
    />

    <BlockStack gap="200">
      <Checkbox
        label="Sync new leads automatically"
        checked={config.syncEnabled}
        onChange={handleSyncToggle}
      />
      <Checkbox
        label="Add campaign name as tag"
        checked={config.addTags}
        onChange={handleTagsToggle}
      />
      <Checkbox
        label="Include discount codes"
        checked={config.includeDiscountCode}
        onChange={handleDiscountToggle}
      />
    </BlockStack>

    <Divider />

    <InlineStack align="space-between">
      <Text tone="subdued">
        Last synced: {formatRelativeTime(lastSyncAt)}
      </Text>
      <ButtonGroup>
        <Button onClick={handleSync}>Sync Now</Button>
        <Button variant="plain" onClick={handleViewLogs}>View Logs</Button>
      </ButtonGroup>
    </InlineStack>
  </BlockStack>
</Card>
```

### 9.4 OAuth Flow UX

1. User clicks "Connect"
2. New window/tab opens with provider OAuth page
3. User logs in and authorizes
4. Redirect back to app with success message
5. Card updates to "Connected" state
6. List selector populates automatically

**Error Handling:**
- Show toast for connection errors
- Provide "Try Again" button
- Log errors for debugging

### 9.5 Sync Log Modal

```
┌────────────────────────────────────────────────────────────────────┐
│ Mailchimp Sync History                                      [×]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Time             │ Email              │ Status    │ Campaign   │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ 2 mins ago       │ user@example.com   │ ✓ Success │ Newsletter │ │
│ │ 5 mins ago       │ another@test.com   │ ✓ Success │ Flash Sale │ │
│ │ 10 mins ago      │ bad@email          │ ✗ Failed  │ Newsletter │ │
│ │                  │ Invalid email format                        │ │
│ │ 15 mins ago      │ valid@user.com     │ ✓ Success │ Spin Win   │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ Showing 10 of 156 sync events           [Load More]               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## A6. Security Considerations

### 10.1 Credential Encryption

All OAuth tokens and API keys MUST be encrypted at rest.

```typescript
// app/domains/integrations/utils/encryption.server.ts

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Must be 32 bytes (256 bits)
const ENCRYPTION_KEY = Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY!, "hex");

export function encryptCredentials(credentials: object): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  const plaintext = JSON.stringify(credentials);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptCredentials<T = unknown>(encrypted: string): T {
  const [ivHex, authTagHex, data] = encrypted.split(":");

  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted) as T;
}
```

### 10.2 Environment Variables Security

```env
# Generate with: openssl rand -hex 32
INTEGRATION_ENCRYPTION_KEY=

# Mailchimp OAuth (from Mailchimp Developer)
MAILCHIMP_CLIENT_ID=
MAILCHIMP_CLIENT_SECRET=

# Klaviyo OAuth (from Klaviyo Developer)
KLAVIYO_CLIENT_ID=
KLAVIYO_CLIENT_SECRET=

# Do NOT commit these to version control!
```

### 10.3 OAuth State Parameter

Prevent CSRF attacks with state validation:

```typescript
function generateOAuthState(shop: string): string {
  const nonce = randomBytes(16).toString("hex");
  const payload = { shop, nonce, timestamp: Date.now() };
  const signature = createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(JSON.stringify(payload))
    .digest("hex");
  return Buffer.from(JSON.stringify({ ...payload, signature })).toString("base64url");
}

function validateOAuthState(state: string, shop: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(state, "base64url").toString());

    // Check shop matches
    if (payload.shop !== shop) return false;

    // Check timestamp (10 min expiry)
    if (Date.now() - payload.timestamp > 600000) return false;

    // Verify signature
    const { signature, ...data } = payload;
    const expected = createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
      .update(JSON.stringify(data))
      .digest("hex");

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
```

### 10.4 Rate Limit Handling

Never expose rate limit errors to merchants as-is. Abstract them:

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After") || "60";

  // Log for monitoring
  console.warn(`[${provider}] Rate limited, retry after ${retryAfter}s`);

  // Queue for retry (don't fail immediately)
  await queueForRetry(payload, parseInt(retryAfter, 10));

  // Return soft failure to user
  return {
    success: false,
    retryable: true,
    error: "Sync queued - provider is temporarily busy",
  };
}
```

### 10.5 Token Revocation Handling

When a user disconnects or revokes access:

1. Delete stored credentials immediately
2. Clear integration config
3. Log disconnect event
4. (Optional) Revoke token via provider API if supported

```typescript
async function disconnectIntegration(integrationId: string): Promise<void> {
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
  });

  if (integration) {
    // Some providers support token revocation
    if (integration.provider === "MAILCHIMP") {
      // Mailchimp doesn't have revoke endpoint - just delete locally
    } else if (integration.provider === "KLAVIYO") {
      // Klaviyo supports revocation
      const credentials = await decryptCredentials(integration.credentials);
      await fetch("https://a.klaviyo.com/oauth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: credentials.accessToken,
          client_id: process.env.KLAVIYO_CLIENT_ID!,
          client_secret: process.env.KLAVIYO_CLIENT_SECRET!,
        }),
      });
    }

    // Delete integration record
    await prisma.integration.delete({
      where: { id: integrationId },
    });
  }
}
```

---

## A7. Error Handling Strategy

### 11.1 Error Categories

| Category | Examples | Handling |
|----------|----------|----------|
| **Retryable** | Rate limits, timeouts, 5xx errors | Queue for retry with backoff |
| **Non-retryable** | Invalid email, missing fields | Log and skip |
| **Auth errors** | Expired/revoked token | Prompt reconnect |
| **Config errors** | List deleted, invalid settings | Notify user |

### 11.2 Retry Logic

```typescript
// app/domains/integrations/utils/retry.server.ts

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // ms
  maxDelay: number;       // ms
  exponentialBase: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, exponentialBase } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with jitter
      const delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );
      const jitter = Math.random() * 0.3 * delay;

      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof FetchError) {
    // Network errors are retryable
    return true;
  }

  if (error instanceof APIError) {
    // Rate limits and server errors are retryable
    return error.status === 429 || error.status >= 500;
  }

  return false;
}
```

### 11.3 Error Notifications

```typescript
// User-facing error messages
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  "invalid_token": "Your connection has expired. Please reconnect.",
  "invalid_grant": "Connection revoked. Please reconnect.",

  // Config errors
  "list_not_found": "The selected list no longer exists. Please choose another.",
  "invalid_email": "Email address was not accepted by the provider.",

  // Sync errors
  "rate_limited": "Sync queued - the provider is temporarily busy.",
  "sync_failed": "Sync failed. We'll retry automatically.",

  // Generic
  "unknown": "Something went wrong. Please try again.",
};

function getUserFriendlyError(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.unknown;
}
```

### 11.4 Alerting and Monitoring

Track these metrics:
- Sync success rate per provider
- Average sync latency
- Rate limit hits
- Auth failures (potential token expiry)
- Error distribution by type

```typescript
// Example: Track sync metrics
async function trackSyncMetric(
  provider: IntegrationProvider,
  success: boolean,
  duration: number,
  errorType?: string
): Promise<void> {
  // Log for analytics/monitoring
  console.log(JSON.stringify({
    event: "integration_sync",
    provider,
    success,
    duration,
    errorType,
    timestamp: new Date().toISOString(),
  }));

  // Could also send to analytics service
  // await analytics.track("integration_sync", { ... });
}
```

---

## A8. Implementation Roadmap

### 12.1 Phase Overview

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 0** | Planning & Design | 1 week | ✅ Complete |
| **Phase 1** | Shared Infrastructure | 1 week | 🔜 Next |
| **Phase 2** | Klaviyo Integration | 1.5 weeks | Planned |
| **Phase 3** | Mailchimp Integration | 1.5 weeks | Planned |
| **Phase 4** | Yotpo Integration | 1 week | Planned |
| **Phase 5** | Polish & Testing | 1 week | Planned |

**Total Estimated Duration:** 6-7 weeks

### 12.2 Phase 1: Shared Infrastructure (Week 1)

**Goals:**
- Database schema and migrations
- Base service architecture
- Encryption utilities
- UI component scaffolding

**Tasks:**

- [ ] Create `app/domains/integrations/` directory structure
- [ ] Add `Integration` and `IntegrationSyncLog` models to Prisma
- [ ] Run migration and generate client
- [ ] Implement `encryption.server.ts` utility
- [ ] Implement `retry.server.ts` utility
- [ ] Create `BaseIntegrationService` abstract class
- [ ] Create `SyncOrchestrator` service
- [ ] Create `IntegrationCard` UI component (empty state)
- [ ] Add "Integrations" tab to Settings page
- [ ] Set up environment variable structure

**Deliverables:**
- Working infrastructure (no providers yet)
- Settings page shows integration cards with "Coming Soon"

### 12.3 Phase 2: Klaviyo Integration (Weeks 2-3)

**Why Klaviyo First:**
1. Most popular among Shopify merchants
2. Modern, well-documented API
3. Built-in SMS support
4. Aligns with e-commerce focus

**Tasks:**

- [ ] Register OAuth app with Klaviyo
- [ ] Implement `KlaviyoService` class
- [ ] Implement OAuth flow (connect/callback)
- [ ] Implement `fetchLists()` method
- [ ] Implement `syncLead()` method
- [ ] Implement token refresh logic
- [ ] Create `KlaviyoSettings` UI component
- [ ] Add Klaviyo to sync orchestrator
- [ ] Integration with lead submission endpoints
- [ ] Manual sync functionality
- [ ] Sync log display

**Deliverables:**
- Fully working Klaviyo integration
- OAuth connection flow
- Lead sync with list selection
- Basic error handling

### 12.4 Phase 3: Mailchimp Integration (Weeks 4-5)

**Tasks:**

- [ ] Register OAuth app with Mailchimp
- [ ] Implement `MailchimpService` class
- [ ] Implement OAuth flow with data center handling
- [ ] Implement `fetchLists()` (audiences)
- [ ] Implement `syncLead()` with upsert logic
- [ ] Implement tag management
- [ ] Create `MailchimpSettings` UI component
- [ ] Add merge field support (custom fields)
- [ ] Handle double opt-in setting
- [ ] Sync log display

**Deliverables:**
- Fully working Mailchimp integration
- Tag support
- Merge field mapping

### 12.5 Phase 4: Yotpo Integration (Week 6)

**Tasks:**

- [ ] Implement `YotpoService` class
- [ ] Implement API key authentication
- [ ] Implement `testConnection()` method
- [ ] Implement `syncLead()` (customer creation)
- [ ] Implement points awarding (optional)
- [ ] Create `YotpoSettings` UI component
- [ ] Handle loyalty program opt-in
- [ ] Sync log display

**Deliverables:**
- Working Yotpo integration
- Loyalty enrollment
- Points awarding

### 12.6 Phase 5: Polish & Testing (Week 7)

**Tasks:**

- [ ] End-to-end testing all flows
- [ ] Error handling improvements
- [ ] UI polish and loading states
- [ ] Documentation updates
- [ ] Performance testing
- [ ] Rate limit handling verification
- [ ] Security review
- [ ] User acceptance testing

**Deliverables:**
- Production-ready integrations
- Complete test coverage
- User documentation

### 12.7 Dependency Diagram

```
                    ┌─────────────────────────┐
                    │   Phase 0: Planning     │
                    │   (This Document)       │
                    └────────────┬────────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │      Phase 1: Infrastructure        │
              │  - DB Schema & Migration            │
              │  - Encryption Utils                 │
              │  - Base Service Interface           │
              │  - UI Scaffolding                   │
              └────────────┬────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
   │   Phase 2:    │ │   Phase 3:    │ │   Phase 4:    │
   │   Klaviyo     │ │   Mailchimp   │ │   Yotpo       │
   │               │ │  (after Ph2)  │ │  (after Ph2)  │
   └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
           │                 │                 │
           └────────────┬────┴────────────┬────┘
                        │                 │
                        ▼                 │
              ┌─────────────────┐         │
              │ Phase 5: Polish │◄────────┘
              │ & Testing       │
              └─────────────────┘
```

---

## A9. Testing Strategy

### 13.1 Unit Tests

Test individual service methods with mocked API responses:

```typescript
// tests/unit/integrations/mailchimp.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MailchimpService } from "~/domains/integrations/services/mailchimp.server";

describe("MailchimpService", () => {
  const mockCredentials = {
    accessToken: "mock-token",
    dataCenter: "us6",
  };

  const mockPayload = {
    lead: {
      email: "test@example.com",
      firstName: "Test",
      marketingConsent: true,
    },
    campaign: {
      id: "camp-123",
      name: "Test Campaign",
      templateType: "NEWSLETTER",
    },
    store: {
      id: "store-123",
      shopifyDomain: "test.myshopify.com",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("syncLead", () => {
    it("should add subscriber to list", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "abc123" }),
      });

      const service = new MailchimpService();
      const result = await service.syncLead(
        mockPayload,
        { listId: "list-123", syncEnabled: true },
        mockCredentials
      );

      expect(result.success).toBe(true);
      expect(result.providerId).toBe("abc123");
    });

    it("should handle existing member", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          title: "Member Exists",
          detail: "test@example.com is already a list member",
        }),
      });

      const service = new MailchimpService();
      const result = await service.syncLead(
        mockPayload,
        { listId: "list-123", syncEnabled: true },
        mockCredentials
      );

      // Should attempt upsert instead
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle rate limiting", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "60" }),
      });

      const service = new MailchimpService();
      const result = await service.syncLead(
        mockPayload,
        { listId: "list-123", syncEnabled: true },
        mockCredentials
      );

      expect(result.success).toBe(false);
      expect(result.retryable).toBe(true);
      expect(result.rateLimited).toBe(true);
    });
  });
});
```

### 13.2 Integration Tests

Test OAuth flows and actual API calls with test accounts:

```typescript
// tests/integration/integrations/klaviyo.test.ts

import { describe, it, expect, beforeAll } from "vitest";
import { KlaviyoService } from "~/domains/integrations/services/klaviyo.server";

describe("KlaviyoService Integration", () => {
  // Skip in CI without credentials
  const runIntegrationTests = !!process.env.KLAVIYO_TEST_API_KEY;

  beforeAll(() => {
    if (!runIntegrationTests) {
      console.log("Skipping Klaviyo integration tests - no test credentials");
    }
  });

  it.skipIf(!runIntegrationTests)(
    "should fetch lists from Klaviyo",
    async () => {
      const service = new KlaviyoService();
      const lists = await service.fetchLists({
        accessToken: process.env.KLAVIYO_TEST_API_KEY,
      });

      expect(Array.isArray(lists)).toBe(true);
      expect(lists.length).toBeGreaterThan(0);
      expect(lists[0]).toHaveProperty("id");
      expect(lists[0]).toHaveProperty("name");
    }
  );
});
```

### 13.3 E2E Tests

Test full user flows:

```typescript
// tests/e2e/integrations.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Integration Settings", () => {
  test("should show integration cards on settings page", async ({ page }) => {
    await page.goto("/app/settings");

    // Click Integrations tab
    await page.click('text="Integrations"');

    // Verify all three providers are shown
    await expect(page.locator('text="Mailchimp"')).toBeVisible();
    await expect(page.locator('text="Klaviyo"')).toBeVisible();
    await expect(page.locator('text="Yotpo"')).toBeVisible();
  });

  test("should open OAuth flow when connecting Mailchimp", async ({ page, context }) => {
    await page.goto("/app/settings");
    await page.click('text="Integrations"');

    // Click connect on Mailchimp
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.click('button:has-text("Connect"):near(:text("Mailchimp"))'),
    ]);

    // Verify redirected to Mailchimp
    expect(popup.url()).toContain("login.mailchimp.com");
  });
});
```

### 13.4 Test Accounts

Create test accounts for each provider:

| Provider | Test Account | Notes |
|----------|--------------|-------|
| Mailchimp | Free tier account | Create test audience |
| Klaviyo | Free tier account | Create test list |
| Yotpo | Development account | Contact Yotpo for dev access |

---

## A10. Environment Variables

### 14.1 Required Variables

```env
# ============================================================================
# INTEGRATION CREDENTIALS
# ============================================================================

# Encryption key for stored credentials (REQUIRED)
# Generate with: openssl rand -hex 32
INTEGRATION_ENCRYPTION_KEY=

# Mailchimp OAuth Application (from Mailchimp Developer)
# Register at: https://login.mailchimp.com/oauth2/register
MAILCHIMP_CLIENT_ID=
MAILCHIMP_CLIENT_SECRET=

# Klaviyo OAuth Application (from Klaviyo Developer Portal)
# Register at: https://developers.klaviyo.com/
KLAVIYO_CLIENT_ID=
KLAVIYO_CLIENT_SECRET=

# Note: Yotpo uses API Key auth - no env vars needed
# Merchants provide their own GUID and API Key
```

### 14.2 Development Variables

```env
# ============================================================================
# INTEGRATION TESTING (Development Only)
# ============================================================================

# Test API keys for integration tests (DO NOT USE IN PRODUCTION)
MAILCHIMP_TEST_API_KEY=
KLAVIYO_TEST_API_KEY=
YOTPO_TEST_GUID=
YOTPO_TEST_API_KEY=
```

### 14.3 Environment Setup Checklist

- [ ] Generate encryption key and add to all environments
- [ ] Register Mailchimp OAuth app and get credentials
- [ ] Register Klaviyo OAuth app and get credentials
- [ ] Add OAuth redirect URIs to provider apps
- [ ] Set up test accounts for development
- [ ] Verify encryption key is NOT in version control

---

## A11. Appendix: API Reference

### 15.1 Mailchimp API Summary

| Category | Details |
|----------|---------|
| **Base URL** | `https://{dc}.api.mailchimp.com/3.0` |
| **Auth Header** | `Authorization: Bearer {access_token}` |
| **Content-Type** | `application/json` |
| **Rate Limit** | 10 concurrent connections |
| **Docs** | https://mailchimp.com/developer/marketing/api/ |

**Key Endpoints:**
```
GET  /ping                           # Test connection
GET  /lists                          # Get all audiences
GET  /lists/{list_id}                # Get audience details
POST /lists/{list_id}/members        # Add subscriber
PUT  /lists/{list_id}/members/{hash} # Update/upsert subscriber
POST /lists/{list_id}/members/{hash}/tags  # Add tags
```

### 15.2 Klaviyo API Summary

| Category | Details |
|----------|---------|
| **Base URL** | `https://a.klaviyo.com/api` |
| **Auth Header** | `Authorization: Klaviyo-API-Key {token}` |
| **Revision Header** | `revision: 2024-10-15` |
| **Content-Type** | `application/json` |
| **Rate Limit** | 10/s burst, 150/min steady (M tier) |
| **Docs** | https://developers.klaviyo.com/en/reference |

**Key Endpoints:**
```
GET  /lists                                    # Get all lists
POST /profiles                                 # Create profile
PATCH /profiles/{id}                           # Update profile
POST /profile-subscription-bulk-create-jobs   # Subscribe profiles
POST /events                                   # Track custom events
```

### 15.3 Yotpo API Summary

| Category | Details |
|----------|---------|
| **Loyalty Base URL** | `https://loyalty.yotpo.com/api/v2` |
| **Core Base URL** | `https://api.yotpo.com/v1` |
| **Auth Headers** | `x-guid: {GUID}`, `x-api-key: {API_KEY}` |
| **Content-Type** | `application/json` |
| **Rate Limit** | ~10/s (recommended) |
| **Docs** | https://loyaltyapi.yotpo.com/reference |

**Key Endpoints:**
```
POST /customers                    # Create/update customer
GET  /customers/{id}               # Get customer details
POST /actions                      # Record action (award points)
GET  /campaigns                    # Get active campaigns
```

---

## A12. Open Questions / Decisions Needed

Before implementation begins, clarify:

1. **Billing/Feature Gating:**
   - Should integrations be a premium feature (Growth+ only)?
   - Or available on all plans?

2. **Historical Sync:**
   - Should we implement bulk sync of historical leads?
   - If yes, what's the time range limit?

3. **SMS Consent:**
   - Do our popups currently capture explicit SMS consent?
   - Need to add SMS consent checkbox for Klaviyo SMS sync?

4. **Lead Storage:**
   - Do we have a dedicated `Lead` model?
   - Or are leads only stored in `PopupEvent`?
   - May need to formalize Lead model for sync tracking.

5. **OAuth App Registration:**
   - Who will register the OAuth apps?
   - What email/account should own them?

6. **Priority Confirmation:**
   - Confirm Klaviyo → Mailchimp → Yotpo order
   - Any changes to timeline?

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-30 | Claude | Initial document |

---

*End of Document*


