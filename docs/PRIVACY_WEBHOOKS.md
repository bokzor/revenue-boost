# Privacy Webhooks - GDPR Compliance

This document describes how Revenue Boost handles Shopify's mandatory privacy webhooks for GDPR compliance.

## Overview

Revenue Boost implements full support for Shopify's three mandatory privacy webhooks:

1. **`customers/data_request`** - Compiles all customer data when a customer requests their information
2. **`customers/redact`** - Anonymizes customer data when deletion is requested
3. **`shop/redact`** - Deletes all shop data 48 hours after app uninstallation

All handlers are **idempotent** and can be safely called multiple times without errors.

## Webhook Handlers

### 1. customers/data_request

**Trigger**: When a customer requests access to their personal data (GDPR Article 15 - Right of Access)

**Handler**: `app/webhooks/privacy/customers-data-request.ts`

**Route**: `POST /webhooks/customers/data_request`

**What it does**:
- Compiles all customer data stored by the app
- Returns structured JSON with customer information
- Logs the data request for merchant records

**Data Compiled**:

| Data Type | Fields Included |
|-----------|----------------|
| **Leads** | Email, name, phone, campaign info, discount codes, marketing consent, submission date |
| **Conversions** | Order IDs, order numbers, total price, discount amounts, discount codes used |
| **Events** | Popup views, clicks, submissions, page URLs, timestamps |

**Response Format**:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 67890,
      "email": "customer@example.com",
      "phone": "+1234567890"
    },
    "leads": [...],
    "conversions": [...],
    "events": [...]
  }
}
```

**Notes**:
- Returns empty arrays if no data found (not an error)
- Limits events to 1000 most recent to prevent excessive data
- In production, this data should be provided to the merchant for customer delivery

---

### 2. customers/redact

**Trigger**: When a customer requests deletion of their personal data (GDPR Article 17 - Right to Erasure)

**Handler**: `app/webhooks/privacy/customers-redact.ts`

**Route**: `POST /webhooks/customers/redact`

**What it does**:
- Anonymizes all customer PII in the database
- Preserves campaign analytics by keeping anonymized records
- Executes all operations in a database transaction for atomicity

**Data Anonymized**:

| Model | Fields Anonymized | Strategy |
|-------|------------------|----------|
| **Lead** | email, firstName, lastName, phone, shopifyCustomerId, ipAddress, userAgent, referrer, metadata | Email set to `redacted@privacy.local`, others set to `null` |
| **PopupEvent** | ipAddress, userAgent, referrer, visitorId, metadata | All set to `null` |
| **CampaignConversion** | customerId | Set to `null` |

**Why Anonymize Instead of Delete?**:
- Preserves campaign performance metrics (conversion rates, revenue attribution)
- Maintains referential integrity in the database
- Complies with GDPR while allowing merchants to analyze campaign effectiveness
- Anonymized data cannot be linked back to the individual

**Idempotency**:
- Multiple calls for the same customer will not cause errors
- Already-anonymized data is simply updated again with the same values
- Returns 200 OK even if no data found

---

### 3. shop/redact

**Trigger**: 48 hours after a shop uninstalls the app (Shopify's retention window)

**Handler**: `app/webhooks/privacy/shop-redact.ts`

**Route**: `POST /webhooks/shop/redact`

**What it does**:
- Deletes ALL shop data from the database
- Removes all sessions, campaigns, leads, events, and related data
- Executes in a transaction to ensure complete deletion

**Data Deleted**:

| Model | Deletion Method |
|-------|----------------|
| **Session** | Direct deletion (all sessions for shop) |
| **Store** | Direct deletion (triggers cascade deletes) |
| **Campaign** | Cascade delete (via Store foreign key) |
| **Lead** | Cascade delete (via Store foreign key) |
| **PopupEvent** | Cascade delete (via Store foreign key) |
| **CampaignConversion** | Cascade delete (via Campaign foreign key) |
| **Experiment** | Cascade delete (via Store foreign key) |
| **Template** (store-specific) | Cascade delete (via Store foreign key) |
| **CustomerSegment** (store-specific) | Cascade delete (via Store foreign key) |
| **SegmentMembership** | Cascade delete (via Store foreign key) |

**Notes**:
- Global templates (storeId = null) are NOT deleted
- Cascade deletes are handled by Prisma based on schema `onDelete: Cascade` settings
- Security records (ChallengeToken, RateLimitLog) are left to expire naturally as they don't contain shop PII

**Idempotency**:
- Returns 200 OK even if shop already deleted
- Safe to call multiple times

---

## Security & Validation

All webhook handlers use Shopify's built-in HMAC validation via `authenticate.webhook()`:

```typescript
const { shop, payload, topic } = await authenticate.webhook(request);
```

This ensures:
- ✅ Request is from Shopify (valid HMAC signature)
- ✅ Payload has not been tampered with
- ✅ Request is for the correct shop

Invalid requests (wrong HMAC, malformed payload) are rejected with appropriate HTTP status codes:
- `400 Bad Request` - Invalid topic or malformed payload
- `401 Unauthorized` - Invalid HMAC signature (handled by Shopify SDK)
- `500 Internal Server Error` - Processing error (triggers Shopify retry)

---

## Testing

### Unit Tests
Location: `tests/unit/webhooks/privacy.test.ts`

Tests:
- ✅ Valid payloads for each webhook type
- ✅ Store not found scenarios
- ✅ Empty data scenarios
- ✅ Idempotency (multiple calls)
- ✅ Error handling

### Integration Tests
Location: `tests/integration/webhooks/privacy.test.ts`

Tests:
- ✅ Full webhook flow with real database operations
- ✅ Data compilation for customers/data_request
- ✅ Data anonymization for customers/redact
- ✅ Complete deletion for shop/redact
- ✅ Idempotency with actual database state

Run tests:
```bash
# Unit tests
npm run test -- tests/unit/webhooks/privacy.test.ts

# Integration tests
npm run test -- tests/integration/webhooks/privacy.test.ts
```

---

## Webhook Registration

Webhooks are registered in `shopify.app.toml` and `shopify.app.staging.toml`:

```toml
[[webhooks.subscriptions]]
topics = [ "customers/data_request" ]
uri = "/webhooks/customers/data_request"

[[webhooks.subscriptions]]
topics = [ "customers/redact" ]
uri = "/webhooks/customers/redact"

[[webhooks.subscriptions]]
topics = [ "shop/redact" ]
uri = "/webhooks/shop/redact"
```

Shopify automatically registers these webhooks when the app is installed or updated.

---

## Compliance Notes

### GDPR Requirements Met

✅ **Right of Access (Article 15)**: `customers/data_request` provides complete data export

✅ **Right to Erasure (Article 17)**: `customers/redact` anonymizes all PII

✅ **Data Retention**: `shop/redact` deletes data after uninstallation

### Data Retention Policy

- **Customer Data**: Anonymized upon request, retained in anonymized form for analytics
- **Shop Data**: Deleted 48 hours after uninstallation (Shopify's retention window)
- **Anonymized Data**: Retained indefinitely for campaign performance analytics (cannot be linked to individuals)

### Merchant Responsibilities

Merchants using Revenue Boost should:
1. Include the app in their privacy policy
2. Inform customers that popup data is collected
3. Provide a way for customers to request data deletion (Shopify handles this automatically)

---

## Troubleshooting

### Webhook Not Received

1. Check webhook registration in Shopify Partner Dashboard
2. Verify app URL is correct and accessible
3. Check Shopify webhook delivery logs

### Webhook Failing

1. Check application logs for error messages
2. Verify database connectivity
3. Ensure Prisma schema is up to date (`npm run prisma:generate`)

### Testing Webhooks Locally

Use Shopify CLI to trigger test webhooks:

```bash
# Test customers/data_request
shopify app webhook trigger --topic customers/data_request

# Test customers/redact
shopify app webhook trigger --topic customers/redact

# Test shop/redact
shopify app webhook trigger --topic shop/redact
```

---

## Support

For questions or issues related to privacy webhooks:
1. Check this documentation
2. Review test files for examples
3. Check Shopify's official documentation: https://shopify.dev/docs/apps/build/privacy-law-compliance

