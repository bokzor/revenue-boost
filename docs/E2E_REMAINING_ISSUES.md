# E2E Test Remaining Issues

This document tracks the remaining issues discovered during E2E test stabilization that require separate investigation and fixes.

## Overview

After fixing 148 E2E tests, 5 tests remain skipped due to deeper issues in the SDK or server-side filtering logic. These issues affect specific features and should be prioritized based on customer impact.

---

## Issue 1: Server-Side Frequency Capping NOT Enforcing Limits (HIGH PRIORITY)

**Test:** `storefront-session-rules.spec.ts` - "multiple impressions allowed when configured"

**Symptom:** Popup shows 4 times even though `maxImpressionsPerSession: 3` is configured. The server-side frequency capping is not enforcing the limit.

**Previous Fix (SDK - DEPLOYED ✅):**
The SDK now correctly detects frequency capping and defers to server control:
```
[Revenue Boost] Campaign has frequency capping enabled, server controls visibility
```

**Current Issue (Server-Side):**
The server at `/api/campaigns/active` is returning the campaign on ALL requests, regardless of impression count. The server should track impressions (via Redis or session) and filter out campaigns that have exceeded their `max_triggers_per_session` limit.

**Investigation Needed:**
1. Check how the server tracks session impressions
2. Verify Redis/session storage is properly incrementing impression counts
3. Check `CampaignFilterService` for frequency capping logic
4. Ensure the `sessionId` is being used to track impressions per session

**Files:**
- `app/routes/api.campaigns.active.tsx` - API endpoint
- `app/domains/campaigns/services/campaign-filter.server.ts` - filtering logic
- Redis/session configuration for impression tracking
- `tests/e2e/staging/storefront-session-rules.spec.ts:194` (test failing)

---

## Issue 2: Cart Value Trigger - RESOLVED ✅

**Test:** `storefront-cart-triggers.spec.ts` - "popup shows when cart value exceeds min threshold"

**Status:** FIXED - SDK deployed and test passing.

**What was fixed:**
- SDK now has polling implementation for `/cart.js`
- Cart events are properly detected
- Popup shows when cart value exceeds threshold

**Evidence from logs:**
```
[Revenue Boost] 💰 cart_value trigger: polling /cart.js every 2000ms
[Revenue Boost] 💰 Cart event detected, fetched /cart.js: $629.95
[Revenue Boost] ✅ cart_value trigger conditions met (cart event + /cart.js check)
```

---

## Issue 3: Server-Side Session Rules Filtering (MEDIUM PRIORITY)

**Test:** `storefront-targeting.spec.ts` - "new visitor targeting shows popup only to first-time visitors"

**Symptom:** Campaign with `sessionRules` targeting `isReturningVisitor=false` returns 0 campaigns from API.

**Root Cause:**
The campaign is created successfully with:
```json
{
  "audienceTargeting": {
    "enabled": true,
    "sessionRules": {
      "enabled": true,
      "conditions": [{ "field": "isReturningVisitor", "operator": "eq", "value": false }],
      "logicOperator": "AND"
    }
  }
}
```

But the API at `/api/campaigns/active` returns 0 campaigns even when `isReturningVisitor=false` is in the request.

**Investigation Needed:**
1. Add logging to `CampaignFilterService.filterCampaigns()` to see why campaign is filtered out
2. Check if `sessionRules` evaluation logic handles the `isReturningVisitor` field correctly
3. Verify the field name matches between API request params and filter logic

**Files:**
- `app/domains/campaigns/services/campaign-filter.server.ts`
- `tests/e2e/staging/storefront-targeting.spec.ts:139` (test skipped)

---

## Issue 4: Server-Side Page Targeting Wildcard Matching (LOW PRIORITY)

**Test:** `storefront-targeting.spec.ts` - "shows only on specific pages"

**Symptom:** Campaign targeting `*/collections/*` doesn't show on `/collections/all` page.

**Root Cause:**
The page targeting uses wildcard patterns like `*/collections/*` but the server-side filtering doesn't match against `/collections/all`.

**Investigation Needed:**
1. Check how `pageTargeting.pages` patterns are evaluated
2. Verify wildcard matching logic (glob vs regex)
3. Test with different pattern formats: `/collections/*`, `**/collections/**`, etc.

**Files:**
- `app/domains/campaigns/services/campaign-filter.server.ts` - page targeting logic
- `tests/e2e/staging/storefront-targeting.spec.ts:190` (test skipped)

---

## Issue 5: Discount Code URL Persistence (LOW PRIORITY)

**Test:** `storefront-checkout-flow.spec.ts` - "discount code persists to checkout URL"

**Symptom:** Test expects discount to be applied when navigating to `/checkout?discount=URL10-TEST`

**Root Cause:**
This test requires actual Shopify discount codes to be pre-configured in the store. The test creates a campaign with `withAutoApplyDiscount()` but the discount code generated (`URL10-TEST`) doesn't exist in Shopify's discount system.

**Fix Options:**
1. Create actual discount codes in staging store and update test to use them
2. Mock the discount validation endpoint
3. Change test to only verify the discount code is passed to checkout URL (not that it's applied)

**Files:**
- `tests/e2e/staging/storefront-checkout-flow.spec.ts:333` (test skipped)

---

## Issue 6: Geographic Targeting Not Filtering (MEDIUM PRIORITY)

**Test:** `storefront-advanced-features.spec.ts` - "campaign hides for non-matching country (mocked FR visitor)"

**Symptom:** US-only campaign still shows when `X-Country-Code: FR` header is sent.

**Root Cause:**
Server-side geo-targeting filtering is not working. The campaign with `geoTargeting: { mode: 'include', countries: ['US'] }` is still being returned for FR visitors.

**Investigation Needed:**
1. Check how the server reads country code (header vs IP geolocation)
2. Verify `CampaignFilterService` handles geo-targeting
3. Check if `X-Country-Code` header is being processed

**Files:**
- `app/domains/campaigns/services/campaign-filter.server.ts`
- `tests/e2e/staging/storefront-advanced-features.spec.ts:133` (test skipped)

---

## Summary Table

| Issue | Priority | Type | Effort | Status |
|-------|----------|------|--------|--------|
| Frequency Capping Enforcement | HIGH | Server Bug | Medium | Server not enforcing limits |
| Cart Value Polling | - | - | - | ✅ RESOLVED |
| Session Rules Filtering | MEDIUM | Server Bug | Medium | Investigation needed |
| Page Targeting Wildcards | LOW | Server Bug | Low | Investigation needed |
| Geographic Targeting | MEDIUM | Server Bug | Medium | Investigation needed |
| Discount URL Persistence | LOW | Test Setup | Low | Needs store config |

---

## Next Steps

1. **High Priority:** Fix server-side frequency capping enforcement (Issue 1)
   - Investigate how impressions are tracked per session
   - Check Redis/session storage implementation
   - Ensure `max_triggers_per_session` is enforced
2. **Medium Priority:** Investigate server-side filtering issues:
   - Session rules filtering (Issue 3)
   - Page targeting wildcards (Issue 4)
3. **Low Priority:** Set up discount codes in staging store (Issue 5)

