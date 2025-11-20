# Analytics & Attribution – Implementation Checklist

This file tracks all work needed to implement analytics, attribution, and plan-usage tracking for Revenue Boost.

## 0. Foundations: Data Models & Infrastructure

- [x] Extend `Campaign` model with:
  - [x] `marketingEventId: String?`
  - [x] `utmCampaign: String?`
  - [x] `utmSource: String?`
  - [x] `utmMedium: String?`
- [x] Add `CampaignConversion` model:
  - [x] Fields: `id`, `campaignId`, `orderId`, `orderNumber`, `totalPrice`, `discountAmount`, `discountCodes[]`, `customerId?`, `source`, `createdAt`
  - [x] Index on `campaignId`
- [x] Add `PopupEvent` model for on-site events:
  - [x] Core fields: `storeId`, `campaignId`, `experimentId?`, `variantKey?`, `leadId?`, `sessionId`, `visitorId?`
  - [x] Context: `eventType`, `pageUrl?`, `pageTitle?`, `referrer?`, `userAgent?`, `ipAddress?`, `deviceType?`, `metadata?`
- [x] Implement `PopupEventService`:
  - [x] `recordEvent(...)`
  - [x] Aggregations (impressions per campaign, per period)
- [x] Run Prisma migrations and regenerate client

## 1. Marketing Events API Integration (Phase 1)

- [ ] Update `shopify.app.toml` scopes:
  - [ ] `write_marketing_events, read_marketing_events, read_orders, write_discounts, read_discounts`
- [ ] Reinstall app on dev store to grant new scopes
- [ ] Implement `app/domains/analytics/services/marketing-events.server.ts`:
  - [ ] `createMarketingEvent(admin, { campaignId, campaignName, templateType, startedAt, productIds? })`
  - [ ] `updateMarketingEvent(admin, marketingEventId, { endedAt?, budget? })`
  - [ ] `generateUTMParams(campaignId, templateType)`
  - [ ] `mapTemplateToEventType(templateType)`
- [ ] Wire into campaign activation/deactivation:
  - [ ] On activation: create marketing event, store `marketingEventId`, `utmCampaign`, `utmSource`, `utmMedium`, set status `ACTIVE`
  - [ ] On pause/disable: call `updateMarketingEvent` with `endedAt`
- [ ] Implement `addUTMParams(url, campaign)` helper based on stored `utm*` fields
- [ ] Use `addUTMParams` in popup components for outbound links

## 2. Discount Code Tracking via Webhook (Phase 2)

- [ ] Implement `app/webhooks/orders.create.ts`:
  - [ ] Verify `topic === 'ORDERS_CREATE'`
  - [ ] Parse order payload
  - [ ] Filter discount codes created by Revenue Boost (e.g. `REVENUE-BOOST-` prefix)
  - [ ] Find campaign by `discountConfig.code`
  - [ ] Create `CampaignConversion` record with amounts and codes
- [ ] Register `ORDERS_CREATE` webhook in `shopify.server.ts` (callback `/webhooks/orders/create`)
- [ ] Verify webhook registration in Shopify / via CLI
- [ ] Test webhook with `shopify app webhook trigger --topic orders/create`

## 3. On-Site Popup Event Tracking (Impressions, Submits, Coupons)

- [x] Dual-write impressions from `/api/analytics/frequency`:
  - [x] Keep Redis-based frequency capping
  - [x] Also call `PopupEventService.recordEvent` with `eventType: VIEW` and full context (campaign/experiment, session, visitor, URL, UA, device, IP)
  - [x] Exclude preview mode from impressions
- [x] Track submissions and coupon events from lead submit route:
  - [x] On successful lead creation: record `SUBMIT` event (link to `leadId`, `campaignId`, `sessionId`, `visitorId`)
  - [x] When discount code issued: record `COUPON_ISSUED` event with same identifiers
- [x] Optional extra events:
  - [x] Track `CLICK` events for main CTAs
  - [x] Track `CLOSE` events when popup dismissed
- [x] Implement aggregation helpers on `PopupEvent`:
  - [x] Impressions per campaign / experiment / variant (campaign-level implemented; experiment/variant later)
  - [x] Submits per campaign
  - [x] Simple funnel stats (view → submit → coupon)

## 4. Billing & Plan Usage Metrics (Impressions per Store per Month)

- [ ] Implement service to compute monthly impressions per store from `PopupEvent` (`eventType = VIEW`)
- [ ] Add short-lived caching (e.g. Redis) for store usage totals
- [ ] Expose usage to admin UI (usage bars / labels)
- [ ] Integrate with plan enforcement (compare usage vs Free/Starter/Growth caps)

## 5. Admin Analytics Surfaces (Phase 3)

- [ ] Create `app/routes/app.campaigns.$campaignId.analytics.tsx`:
  - [ ] Loader: fetch campaign + its `CampaignConversion` records, compute totals
  - [ ] UI: summary cards for conversions, revenue, discount, AOV; list of recent conversions
- [ ] (Optional) Enhance campaigns list view:
  - [ ] Show impressions, leads, and conversion rate per campaign using `PopupEvent` + leads
  - [ ] Clearly separate on-site conversion rate vs revenue attribution metrics

## 6. Reporting Back to Shopify & Advanced Attribution

- [ ] Implement scheduled job to report engagement metrics back to Marketing Events API (views, clicks, conversions per campaign)
- [ ] Design and implement Web Pixel extension for advanced client-side tracking (later phase)
- [ ] Ensure `PopupEvent` and `CampaignConversion` can be grouped by experiment/variant for A/B test analytics

## 7. Testing & Verification

- [ ] Marketing Events API:
  - [ ] Campaign activation creates marketing event and stores IDs/UTM
  - [ ] Events appear in Shopify Marketing dashboard
  - [ ] Deactivation updates/ends the marketing event
- [ ] Discount code tracking:
  - [ ] Webhook receives `orders/create`
  - [ ] Discount codes from our app detected
  - [ ] `CampaignConversion` records created and shown in analytics UI
- [ ] UTM parameters:
  - [ ] Popup links include UTM params, propagate to checkout, and appear in `customerJourneySummary`
- [x] Popup events & conversion rate:
  - [x] `/api/analytics/frequency` writes both Redis and `PopupEvent (VIEW)`
  - [x] Lead submissions write `SUBMIT` and `COUPON_ISSUED`
  - [x] Aggregations feed `CampaignAnalyticsService` to compute real conversion rates (handle zero-division)
- [ ] Plan usage:
  - [ ] Monthly impression counts accurate per store
  - [ ] Usage reflected correctly in plan UI and enforcement

