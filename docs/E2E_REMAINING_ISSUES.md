# E2E Test Remaining Issues

This document tracks the remaining issues discovered during E2E test stabilization that require separate investigation and fixes.

## Overview

After fixing 148 E2E tests, 5 tests remain skipped due to deeper issues in the SDK or server-side filtering logic. These issues affect specific features and should be prioritized based on customer impact.

---

## Issue 1: SDK Frequency Capping Detection (HIGH PRIORITY)

**Test:** `storefront-session-rules.spec.ts` - "multiple impressions allowed when configured"

**Symptom:** Popup shows once but doesn't show again after reload, even when `maxImpressionsPerSession: 3` is configured.

**Root Cause:** 
The SDK was checking for frequency capping in the wrong location:
- API returns: `clientTriggers.enhancedTriggers.frequency_capping`
- SDK was checking: `targetRules.enhancedTriggers.frequency_capping` (always empty)

**Fix Applied:** Updated `extensions/storefront-src/index.ts` line 326 to check both locations:
```typescript
const enhancedTriggers = (campaign as unknown as { clientTriggers?: { enhancedTriggers?: Record<string, unknown> } }).clientTriggers?.enhancedTriggers || campaign.targetRules?.enhancedTriggers;
```

**Action Required:** 
- [ ] Deploy the storefront extension to Shopify (`shopify app deploy`)
- [ ] Re-enable the skipped test after deployment
- [ ] Verify frequency capping works on staging store

**Files:**
- `extensions/storefront-src/index.ts` (fix applied)
- `tests/e2e/staging/storefront-session-rules.spec.ts:196` (test skipped)

---

## Issue 2: Cart Value Trigger - SDK Needs Deployment (HIGH PRIORITY)

**Test:** `storefront-cart-triggers.spec.ts` - "popup shows when cart value exceeds min threshold"

**Symptom:** Cart value trigger doesn't detect cart updates. Logs show old message `cart_value trigger waiting for cart update events` instead of the current polling implementation.

**Root Cause:**
The staging store is running an **OLD version of the SDK** that doesn't have the polling implementation. The current local code in `extensions/storefront-src/core/TriggerManager.ts` has been updated with polling logic (`💰 Polling /cart.js every ${checkInterval}ms`) but this has **NOT been deployed** to the staging store.

Evidence from logs:
- Old SDK shows: `cart_value trigger waiting for cart update events (current value 0 is outside range)`
- Current code should show: `cart_value trigger: polling /cart.js every ${checkInterval}ms`

**Fix Required:**
Deploy the storefront extension to staging:
```bash
shopify app deploy
```

**Action Items:**
- [ ] Deploy the storefront extension to Shopify
- [ ] Verify polling logs appear after deployment
- [ ] Re-enable the skipped test

**Files:**
- `extensions/storefront-src/core/TriggerManager.ts` - has the polling implementation
- `extensions/storefront-popup/` - needs deployment
- `tests/e2e/staging/storefront-cart-triggers.spec.ts:181` (test skipped)

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

## Summary Table

| Issue | Priority | Type | Effort | Status |
|-------|----------|------|--------|--------|
| Frequency Capping Detection | HIGH | SDK Bug | Low (deploy) | Fix applied, needs deploy |
| Cart Value Polling | HIGH | SDK Outdated | Low (deploy) | Local code ready, needs deploy |
| Session Rules Filtering | MEDIUM | Server Bug | Medium | Investigation needed |
| Page Targeting Wildcards | LOW | Server Bug | Low | Investigation needed |
| Discount URL Persistence | LOW | Test Setup | Low | Needs store config |

---

## Next Steps

1. **Immediate:** Deploy SDK changes (`shopify app deploy`) to unblock:
   - Frequency capping test (Issue 1)
   - Cart value trigger test (Issue 2)
2. **Short-term:** Investigate server-side filtering issues:
   - Session rules filtering (Issue 3)
   - Page targeting wildcards (Issue 4)
3. **Low priority:** Set up discount codes in staging store (Issue 5)

