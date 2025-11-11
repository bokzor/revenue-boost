● 1) Inventory Summary

Found legacy E2E tests under tests/e2e/old:

Top-level specs
• tests/e2e/old/ab-testing-admin.spec.ts — Admin UI flow for creating/configuring A/B experiments.
• Journeys: Create experiment → enable A/B → configure name/hypothesis → manage variants.
• Key assertions: Panels visible, variant toggling, control/variant state, shared fields persistence.
• External deps: Real navigation to /campaigns/new; Prisma client init; timeouts.

     • tests/e2e/old/ab-testing-analytics-tracking.spec.ts — Tracks A/B analytics events end-to-end.
        • Journeys: Trigger variants; assert analytics emission/timing.
        • Key assertions: Events logged/received; timing windows respected.
        • External deps: Likely network watchers/timing; extensive waitForTimeout usage.

     • tests/e2e/old/ab-testing-goal-consistency.spec.ts — Ensures A/B variants preserve campaign goals and consistency.
        • Journeys: Switch variants; validate goal consistency.
        • Key assertions: Goal value stable; UI reflects correct goal context.
        • External deps: UI waits.

     • tests/e2e/old/ab-testing-redirect.spec.ts — Redirect behavior under A/B conditions.
        • Journeys: Variant influences redirect; validate post-redirect state.
        • Key assertions: Correct destination per variant.
        • External deps: Navigation timing.

     • tests/e2e/old/ab-testing-storefront.spec.ts — Storefront variant assignment and persistence.
        • Journeys: Assign A/B variant; persist across sessions/routes.
        • Key assertions: Variant stickiness; distribution.
        • External deps: Waits, possibly analytics.

     • tests/e2e/old/ab-testing-validation.spec.ts — Admin validation for A/B set-up.
        • Journeys: Invalid combos; missing fields; rules.
        • Key assertions: Validation messaging and disabled actions.
        • External deps: UI waits.

     • tests/e2e/old/ab-testing-variant-assignment.spec.ts — Variant assignment distribution and persistence.
        • Journeys: Assign traffic; verify distribution (~50/50 etc.).
        • Key assertions: Distribution metrics; consistency over time.
        • External deps: Timers/waits.

     • tests/e2e/old/ab-testing-variant-title-switching.spec.ts — Variant title switching UI behavior.
        • Journeys: Switch variant titles and verify.
        • Key assertions: Correct title renders; variant active states.
        • External deps: Waits.

     • tests/e2e/old/campaign-priority.spec.ts — Campaign priority resolution and display order.
        • Journeys: Multiple campaigns; verify which shows.
        • Key assertions: Highest priority wins given rules.
        • External deps: Waits.

     • tests/e2e/old/comprehensive-campaign-test.spec.ts — End-to-end campaign creation to popup showing.
        • Journeys: Create, configure, publish; validate storefront popup.
        • Key assertions: Popup visible; content; behavior.
        • External deps: Prisma, login, waits.

     • tests/e2e/old/comprehensive-trigger-coverage.spec.ts — Wide coverage of triggers (page load, timers, idle, scroll, exit).
        • Journeys: Trigger conditions; verify popup show/hide scheduling.
        • Key assertions: Trigger activation timing and order.
        • External deps: Heavy waitForTimeout; timing-sensitive.

     • tests/e2e/old/free-shipping-add-to-cart.spec.ts — Free-shipping discount and add-to-cart interaction.
        • Journeys: Apply free shipping; add to cart; verify messaging.
        • Key assertions: Free shipping applied; copy-to-clipboard; CTA behavior.
        • External deps: Waits; storefront nav.

     • tests/e2e/old/gamification-workflows.spec.ts — Gamified flows orchestration (spin/scratch/lottery).
        • Journeys: Enter flow; play; prize; claim discount.
        • Key assertions: Prize assignment; success UI; discount surfaces.
        • External deps: Waits/time; event sequencing.

     • tests/e2e/old/newsletter-templates-comprehensive.spec.ts — Newsletter templates coverage end-to-end.
        • Journeys: Render, input email, success state.
        • Key assertions: Content text; submission; follow-up state.
        • External deps: Many timeouts; login/preview.

     • tests/e2e/old/newsletter-templates-merchant.spec.ts — Merchant-oriented flows for newsletter templates.
        • Journeys: Configure; view; confirm.
        • Key assertions: Backend persistence and surfaced content.
        • External deps: Storefront login; waits.

     • tests/e2e/old/popup-core-features-comprehensive.spec.ts — Core popup features comprehensive validation.
        • Journeys: Open/close; copy code; CTA navigation; overlays.
        • Key assertions: Visibility; state transitions; accessibility basics.
        • External deps: Many waits.

     • tests/e2e/old/popup-mobile-accessibility.spec.ts — Mobile viewport + accessibility checks.
        • Journeys: Mobile display; keyboard navigation; focus traps.
        • Key assertions: Focus order; scroll lock; dismissal gestures.
        • External deps: Mobile emulation; waits.

     • tests/e2e/old/preview-immediate.spec.ts — Preview mode shows popup immediately; no scheduled triggers.
        • Journeys: Hit preview URL; assert immediate render; no trigger scheduling.
        • Key assertions: Popup visible; container state; console logs.
        • External deps: Real STORE_URL; password; console hooks.

     • tests/e2e/old/product-recommendation-comprehensive.spec.ts — Product recommendation experience.
        • Journeys: Show recommendations; click-through; analytics maybe.
        • Key assertions: Cards present; correct targeting.
        • External deps: Waits.

     • tests/e2e/old/product-upsell-popup.spec.ts — Product upsell popup flow.
        • Journeys: Upsell presentation; CTA; discount.
        • Key assertions: Content; eligibility; click outcomes.
        • External deps: Waits.

     • tests/e2e/old/quick-30min-merchant-test.spec.ts — Merchant smoke test of key features in 30 min.
        • Journeys: High-level multi-feature run-through.
        • Key assertions: “Happy path” signals.
        • External deps: Store; waits.
     • tests/e2e/old/sales-templates-comprehensive.spec.ts — Sales templates (flash, banners) full run.
        • Journeys: Configure; show; timers; urgency.
        • Key assertions: Countdown; urgency messaging; CTA.
        • External deps: Heavily time-based.

     • tests/e2e/old/scratch-card-comprehensive.spec.ts — Scratch card full flow.
        • Journeys: Scratch gesture; reveal prize; claim.
        • Key assertions: Scratch threshold; success UI; code shown.
        • External deps: Gestures/time.

     • tests/e2e/old/segment-targeting-enhanced.spec.ts — Enhanced segment targeting claims.
        • Journeys: Visitor contexts (new/returning/VIP/mobile/desktop/cart) → show logic.
        • Key assertions: Correct segment match; suppression honored.
        • External deps: Time-based (last seen); many waits.

     • tests/e2e/old/social-proof-template.spec.ts — Social proof template behavior.
        • Journeys: Show recent purchase/fomo messages.
        • Key assertions: Message frequency; hiding rules.
        • External deps: Timers; network.

     • tests/e2e/old/spin-to-win-prize-behavior.spec.ts — Spin-to-win prize behavior and boundaries.
        • Journeys: Spin result; prize weight; claim.
        • Key assertions: Prize distribution; message; discount presence.
        • External deps: Randomness/time.

     • tests/e2e/old/template-configuration-validation.spec.ts — Template config validation coverage.
        • Journeys: Invalid/missing fields; errors.
        • Key assertions: Validation UI and disabled saves.
        • External deps: Minimal; still uses waits.
Template-focused specs (tests/e2e/old/templates/)
• cart.spec.ts — Cart-specific popup behavior (add/remove interactions).
• color-theme-combinations.spec.ts — Rendering across color theme combos.
• design-property-combinations.spec.ts — Rendering across design property permutations.
• discount-configurations.spec.ts — Comprehensive discount config matrix (percentage, fixed, free shipping; delivery modes; min amount; expiry; usage; prefixes).
• Confirmed: Uses Prisma to create campaigns; real store login; heavy waitForTimeout; asserts popup visible and content.
• flash-sale.spec.ts — Flash sale template (countdown/urgency).
• lottery.spec.ts — Lottery gamification template flow.
• multistep-newsletter.spec.ts — Multi-step newsletter flow (steps navigation; success).
• newsletter.spec.ts — Basic newsletter flow.
• product.spec.ts — Product template logic.
• scratch-card.spec.ts — Scratch card template basics.
• segment-template-integration.spec.ts — Segment logic integrated with templates (mobile/desktop, cart state).
• segment-validation-simple.spec.ts — Basic segment validation cases.
• social-proof.spec.ts — Social proof template baseline.
• trigger-combinations.spec.ts — Trigger permutations and timing windows.

General patterns across old tests
• Key assertions tend to be: popup visibility, specific copy text present, success states, and some navigation outcomes.
• External dependencies are heavy:
• Real store URL + password gating in many tests (loginToStore).
• Prisma DB writes/reads to seed campaigns on the fly.
• Extensive use of page.waitForTimeout (100–32000 ms), Date.now(), timing heuristics.
• Likely to hit Shopify storefront and/or extensions in a live-like environment.


2) Relevance & Value Assessment
   Legend: Keep (concept only), Modify, Drop
   • ab-testing-admin.spec.ts — Modify
   • Rationale: Valuable admin flows; keep core UI validations. Replace arbitrary timeouts with stable selectors and testids; avoid network dependence.
   • ab-testing-analytics-tracking.spec.ts — Drop
   • Rationale: Analytics end-to-end across network is high-flake and out of scope; cover analytics in integration/unit with event assertions.
   • ab-testing-goal-consistency.spec.ts — Modify
   • Rationale: Business value (prevent goal drift); refactor to clean selectors and deterministic setup.
   • ab-testing-redirect.spec.ts — Modify
   • Rationale: Redirect behaviors matter; recreate with route interception and assertion (no external nav).
   • ab-testing-storefront.spec.ts — Modify
   • Rationale: Variant assignment/persistence important; recreate minimal check with seeded data and local storage/cookie assertions; avoid distribution statistics.
   • ab-testing-validation.spec.ts — Keep (concept only)
   • Rationale: Validation rules should be covered, but better as component/integration tests to reduce e2e flake.
   • ab-testing-variant-assignment.spec.ts — Drop
   • Rationale: Distribution/50-50 stats e2e is noisy; move to deterministic algorithm unit tests.
   • ab-testing-variant-title-switching.spec.ts — Drop (or Merge into admin flow sanity)
   • Rationale: Niche UI concern; can be a small assertion inside admin flow.
   • campaign-priority.spec.ts — Keep (concept only)
   • Rationale: High-value rule; implement a focused e2e that seeds multiple campaigns and asserts which shows. Avoid long timing chains.
   • comprehensive-campaign-test.spec.ts — Drop (as-is)
   • Rationale: Monolithic, brittle. Replace with focused smoke(s).
   • comprehensive-trigger-coverage.spec.ts — Drop (as-is)
   • Rationale: Trigger matrix is timing heavy; cover with smaller, deterministic checks and unit coverage for trigger engine.
   • free-shipping-add-to-cart.spec.ts — Modify
   • Rationale: Relevant to discounts; refactor to mock/add-to-cart event and assert free shipping UX; avoid cart network.
   • gamification-workflows.spec.ts — Modify
   • Rationale: Keep one spin-to-win and one scratch-card happy path; drop large orchestration.
   • newsletter-templates-comprehensive.spec.ts — Modify
   • Rationale: Keep essential newsletter flow; reduce breadth; mock network; seed data.
   • newsletter-templates-merchant.spec.ts — Drop
   • Rationale: Merchant “tour” is overlapping with admin tests; consolidate into admin flow sanity.
   • popup-core-features-comprehensive.spec.ts — Modify
   • Rationale: Keep core: open/close, copy code, CTA; remove broad permutations and arbitrary waits.
   • popup-mobile-accessibility.spec.ts — Keep (concept only)
   • Rationale: Keep top accessibility checks with stable testids and mobile emulation.
   • preview-immediate.spec.ts — Keep (concept only)
   • Rationale: Valuable for preview experience; stabilize with deterministic logs/intercepts.
   • product-recommendation-comprehensive.spec.ts — Drop (or Merge)
   • Rationale: Recommendation logic better as integration (API) + one small e2e that ensures render.
   • product-upsell-popup.spec.ts — Modify
   • Rationale: Keep one core upsell path; mock product data.
   • quick-30min-merchant-test.spec.ts — Drop
   • Rationale: Manual smoke surrogate; not maintainable e2e.
   • sales-templates-comprehensive.spec.ts — Modify
   • Rationale: Keep a minimal flash sale timer scenario; assert countdown shows; avoid real time waits where possible (freeze time).
   • scratch-card-comprehensive.spec.ts — Modify
   • Rationale: Keep a minimal scratch-to-reveal + code path; avoid thresholds that require pixel checks; simulate.
   • segment-targeting-enhanced.spec.ts — Modify
   • Rationale: Segment coverage is valuable; create a few crisp scenarios (new visitor, returning visitor, cart present). Avoid broad combinatorics.
   • social-proof-template.spec.ts — Modify
   • Rationale: Keep one recent-purchase message scenario; mock data/time.
   • spin-to-win-prize-behavior.spec.ts — Modify
   • Rationale: Keep a single deterministic prize path; stub RNG.
   • template-configuration-validation.spec.ts — Drop (or convert to integration)
   • Rationale: Validation logic belongs in integration tests.
   Templates subfolder
   • cart.spec.ts — Modify: keep core cart popup condition with mock cart.
   • color-theme-combinations.spec.ts — Drop: purely visual permutations → visual regression tooling, not e2e.
   • design-property-combinations.spec.ts — Drop: permutations → component/visual tests.
   • discount-configurations.spec.ts — Keep (concept only): critical scenarios for discounts/delivery modes/min amounts/expiry/usage limits; recreate fresh.
   • flash-sale.spec.ts — Modify: keep single countdown behavior scenario with mocked time.
   • lottery.spec.ts — Modify: one happy path flow.
   • multistep-newsletter.spec.ts — Modify: key steps navigation; email submission success.
   • newsletter.spec.ts — Modify: basic flow; overlap with above (consolidate).
   • product.spec.ts — Modify: one product gating scenario; mock.
   • scratch-card.spec.ts — Modify: single basic flow (overlaps with comprehensive).
   • segment-template-integration.spec.ts — Modify: choose 2–3 representative integrations (mobile vs desktop, cart vs none).
   • segment-validation-simple.spec.ts — Modify: keep simple positive/negative match.
   • social-proof.spec.ts — Modify: one simple scenario.
   • trigger-combinations.spec.ts — Drop: timing-heavy; covered via smaller focused tests.

Duplicates/overlaps and consolidation
• Newsletter: consolidate comprehensive + merchant + basic into 1–2 crisp scenarios.
• Scratch-card: keep one minimal scenario; drop broader permutational tests.
• A/B: consolidate to one admin config sanity + one storefront variant stickiness; remove analytics/distribution-heavy tests.
• Triggers: remove combinatorial; keep one preview-immediate and one time-delay check with fake timers.
• Discount coverage: centralize into a minimal matrix focusing on delivery modes and constraints (min amount, expiry, usage).

3) Coverage Map

Mapped old scenarios to current domains:

     • Campaign creation/admin flows
        • ab-testing-admin, template-configuration-validation, newsletter-templates-merchant, comprehensive-campaign-test
        • Current relevance: Yes (admin flows, A/B enablement). Consolidate to one Admin Wizard Smoke.

     • Popup design and templates
        • color/design property combos, template variants (newsletter, multistep, flash, social proof, product, cart)
        • Current relevance: Yes; cover minimal per template; skip permutations.

     • Discount delivery modes and advanced settings
        • discount-configurations, free-shipping-add-to-cart
        • Current relevance: High. Cover:
           • show_code_always
           • show_code_fallback
           • show_in_popup_authorized_only
           • auto_apply_only
           • min purchase amount
           • expiry days
           • usage limit
           • code prefix

     • Newsletter/signup flows
        • newsletter.spec, multistep-newsletter.spec, newsletter-templates-comprehensive
        • Current relevance: High; 1–2 essential flows.

     • Template selection
        • Admin/UI parts implicit in admin flows.
        • Current relevance: Include as step in Admin Wizard Smoke.

     • Segment targeting
        • segment-targeting-enhanced, segment-template-integration, segment-validation-simple
        • Current relevance: Yes; cover 2–3 canonical segments.

     • Mobile/accessibility
        • popup-mobile-accessibility
        • Current relevance: Keep smoke for focus traps and viewport.

     • Preview mode
        • preview-immediate
        • Current relevance: Keep.

Critical gaps to address in new suite
• Email-authorization delivery mode (show_in_popup_authorized_only) behavior with authorized email vs non-authorized.
• Auto-apply-only behavior without code exposure.
• Enforcement-ish checks for min amount/usage limit/expiry (simulate at UX level; no real checkout).
• Code prefix behavior in generated codes.
• Discount delivery fallback path (show_code_fallback) logic linking requireEmailMatch appropriately.
• Deterministic RNG for gamification (spin/scratch) to avoid flake.


4) New Test Suite Plan (from scratch)
   Tagging scheme
   • @smoke — Fast, essential happy paths
   • @core — Core business rules (discounts, delivery modes)
   • @templates — Template-specific behavior
   • @segments — Targeting rules
   • @mobile — Mobile/accessibility
   • @ab — A/B testing basics
   • @preview — Preview behavior
   • @discounts — Discount configuration/advanced settings
   Prioritized scenarios

1) Admin Wizard Smoke — create newsletter campaign with discount (shared, show_code_always) [@smoke @ab?]
   • Steps:
   • Open campaign creation; select goal; select template; enable discount; choose percentage 10%; show_code_always; save.
   • Preview storefront; popup appears on page load; submit email; code shown.
   • Assertions: Campaign saved; preview shows; code visible; correct prefix (if set).
   • Data/fixtures: Seeded store; minimal template availability.
   • Isolation: Intercept network saves (optional); seed DB directly; use testids.
2) Advanced Discount Settings — show_code_always [@core @discounts]
   • Steps:
   • Seed campaign with discount config (percentage, show_code_always).
   • Open storefront; trigger popup; submit email.
   • Assertions: Code shown immediately; value/label correct.
   • Data: Campaign record.
   • Isolation: No external checkout; observe popup content only.

3) Advanced Discount Settings — show_code_fallback with requireEmailMatch [@core @discounts]
   • Steps:
   • Seed campaign show_code_fallback; requireEmailMatch true.
   • As guest: submit email; code visible; note code; confirm badge copy.
   • Assertions: Code shown; badge indicates “Authorized Email Only” (depending on UI); internal flag set in UI if applicable.
   • Data: Campaign record (delivery fallback).
   • Isolation: Assert UI-only; do not test Shopify enforcement.
4) Advanced Discount Settings — show_in_popup_authorized_only [@core @discounts]
   • Steps:
   • Seed campaign: authorized email target, requireEmailMatch true.
   • Submit matching email vs non-matching.
   • Assertions: Matching email: code visible; Non-matching: error message or no code shown; success copy differs.
   • Data: Campaign record.
   • Isolation: Mock validation locally; avoid real customer creation.

5) Advanced Discount Settings — auto_apply_only (no code exposure) [@core @discounts]
   • Steps:
   • Seed campaign: auto_apply_only.
   • Submit email.
   • Assertions: No code shown; success message indicates automatic application.
   • Data: Campaign record.
   • Isolation: UI messaging only.

6) Discount Constraints — min purchase, expiry, usage limit, prefix [@core @discounts]
   • Steps:
   • Seed campaigns individually toggling: minimumAmount ($100), expiryDays (1), usageLimit (1), prefix.
   • Trigger popup; submit; observe banner/badge/copy.
   • Assertions: UI reflects configuration (e.g., “Minimum $100 purchase required”, prefix in code).
   • Data: Multiple campaigns.
   • Isolation: No checkout; pure UX assertions.

7) Newsletter Multi-step Flow [@templates @smoke]
   • Steps:
   • Seed multi-step newsletter content; trigger; navigate steps; submit.
   • Assertions: Stepper advances; success state; code display per delivery mode (reuse from #2/3).
   • Data: Campaign with multistep content.
   • Isolation: No external emails.

8) Segment Targeting Basics [@segments]
   • Steps:
   • Seed segments: new visitor vs returning visitor; cart present vs not; mobile vs desktop.
   • Visit storefront accordingly.
   • Assertions: Popup shows only for matching segment; suppressed otherwise.
   • Data: Campaigns with segment rules.
   • Isolation: Mock cart context/local storage; set UA/viewport for mobile.
9) Preview Mode Immediate [@preview @smoke]
   • Steps:
   • Visit split_pop_preview URL with campaign ID.
   • Assertions: Popup shows immediately; no scheduled triggers (assert absence of timer scheduling logs/state).
   • Data: Campaign with page load trigger.
   • Isolation: Intercept console logs or internal events.

10) Mobile Accessibility Smoke [@mobile]
    • Steps:
    • Mobile viewport; trigger popup; navigate focus; dismiss with close/back.
    • Assertions: Focus trap; scroll lock; escape/back works; visible within viewport.
    • Data: Any campaign.
    • Isolation: deterministic testids and roles.

11) Campaign Priority Resolution [@core]
    • Steps:
    • Seed multiple active campaigns with different priorities; matching rules.
    • Visit storefront.
    • Assertions: Only highest priority shows.
    • Data: 2–3 campaigns.
    • Isolation: No timing; simple visit.
    Notes
    • Avoid analytics distribution tests in e2e; move to integration/unit.
    • Timers: Use fake timers or deterministic logs where possible; minimize waitForTimeout.

5) Skeleton Spec Outlines (no legacy code)

Example skeletons (Playwright style; titles only, no legacy code):
import { test } from '@playwright/test';
test.describe('@smoke Admin Wizard — create newsletter campaign with discount', () => {
test('creates campaign and shows popup with code (show_code_always)', async () => {});
});
test.describe('@discounts Advanced Discount Settings — show_code_fallback', () => {
test('shows code and marks as authorized-email-only when required', async () => {});
});
test.describe('@discounts Advanced Discount Settings — authorized_only', () => {
test('shows code only for matching authorized email', async () => {});
});
test.describe('@discounts Advanced Discount Settings — auto_apply_only', () => {
test('no code exposed; success message indicates auto-apply', async () => {});
});
test.describe('@discounts Discount constraints', () => {
test('renders minimum purchase requirement notice', async () => {});
test('renders code with configured prefix', async () => {});
});
test.describe('@templates Newsletter multistep flow', () => {
test('navigates steps and reaches success state', async () => {});
});
test.describe('@segments Targeting basics', () => {
test('new visitor sees popup; returning visitor suppressed', async () => {});
});
test.describe('@preview Preview immediate', () => {
test('popup appears immediately; no scheduled triggers exist', async () => {});
});


6) Environment & Stability Notes

Assumptions
• E2E runner: Playwright (already in repo).
• DB seeding via Prisma factories/helpers (in-test or pre-test hooks).
• E2E_TEST_MODE (or equivalent) available to bypass auth friction in admin.
• Storefront extension available locally without hitting Shopify admin/network for critical paths.

Flakiness mitigations
• Replace page.waitForTimeout with:
• Deterministic UI readiness conditions (data-testid presence, networkidle after specific route), and explicit waitForSelector on data-testids.
• Use semantic selectors:
• data-testid on popup container, CTA buttons, success banners, code elements, delivery-mode badges.
• Stub randomness and time:
• Deterministic RNG for gamification; mock Date.now or inject test flags for timers. If not feasible in e2e, assert state transitions via event/log intercepts rather than sleeps.
• Network isolation:
• Prefer seeded DB + local service responses; intercept external calls (page.route) to avoid flakiness/cost.
• Viewports:
• Standardize desktop/mobile sizes; ensure scroll locks tested via class/state rather than pixel offsets.
• Logging hooks:
• Expose internal event/log bus (e.g., window.__splitpopEvents) in preview/test mode to assert “no scheduled triggers” etc.
Tooling assumptions
• Use Playwright test projects/tags for grouping.
• Do not install new deps; use existing Prisma and fixtures.
• Favor small e2e scenarios; push permutations into unit/integration/visual tests.


7) Execution Plan & Estimates
   Phased rollout (recommended order)
1) Core discounts and preview
   • Advanced Discount Settings: show_code_always, show_code_fallback, authorized_only, auto_apply_only (4 scenarios) — 6–8 hours
   • Discount constraints: min amount, prefix (2 scenarios) — 3–4 hours
   • Preview immediate (1 scenario) — 1–2 hours
2) Newsletter flows and admin smoke
   • Newsletter multistep (1) — 3–4 hours
   • Admin Wizard Smoke (1) — 4–5 hours
3) Targeting and priority
   • Segment targeting basics (1–2) — 3–4 hours
   • Campaign priority resolution (1) — 2–3 hours
4) Template minimal checks
   • Flash sale countdown minimal (1) — 2–3 hours
   • Upsell/product minimal (1) — 2–3 hours
   • Mobile accessibility smoke (1) — 2–3 hours

Risks / open questions
• How should “authorized email only” be validated without Shopify customer creation? OK to assert only UI states (no checkout)?
• Should we add a small test utility to stub RNG/time in storefront code (behind E2E_TEST_MODE) to remove sleeps?
• Are any templates deprecated (lottery, social proof) for current roadmap? If so, we will skip their scenarios.
• Preferred data-testids for discount elements (code, badges, messages)? If not present, we’ll add minimal attributes.
• Any compliance or analytics tests truly required e2e, or can they be out-of-scope?

If any of the above differ from your priorities, I’ll adjust scope and ordering.

Open Questions

     • Which templates are in active use and should be prioritized: newsletter, multistep newsletter, flash sale, social proof, upsell?
     • For discount tests, is UI-level validation sufficient, or do we need any checkout-level smoke (with strict mocks only)?
     • Are we standardizing data-testid names for popup core elements and discount components to stabilize selectors?
     • Is A/B testing a current focus beyond configuration sanity (e.g., storefront stickiness), or can analytics/distribution be deferred to lower-level tests?


───────────────────────────────────────────────────────

If you approve this plan, I will proceed to:
• Add data-testids where missing (surgical, minimal),
• Implement Phase 1 scenarios with stable selectors and seeded data,
• Avoid external calls with intercepts/mocks, and
• Keep each test under a few seconds by removing arbitrary timeouts.
