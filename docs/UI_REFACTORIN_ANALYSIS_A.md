The storefront popup system is already partly centralized around shared types, hooks, and form field components, but each popup component still mixes business logic with markup and re‑implements the
lead capture form UI and discount code display UI in slightly different ways.
I recommend leaning into the existing shared logic (usePopupForm, useDiscountCode, PopupDesignConfig, Zod content schemas) and adding a small set of shared UI components plus a container/view split
per popup type. Concretely: introduce a reusable LeadCaptureForm component (Name/Email/GDPR), a DiscountCodeDisplay component (code + copy‑to‑clipboard + messaging), and refactor each popup into
XPopupContainer (logic) and XPopupView (presentation). This will centralize behavior (submission flow, GDPR handling, discount lifecycle) while keeping each popup’s visual design flexible.

───────────────────────────────────────────────────────

1. Current popup implementations (inventory & patterns)

1.1 Popup types & where they live
Storefront popups (main focus) – app/domains/storefront/popups-new/:

     • NewsletterPopup.tsx
     • SpinToWinPopup.tsx
     • ScratchCardPopup.tsx
     • FlashSalePopup.tsx
     • CartAbandonmentPopup.tsx
     • FreeShippingPopup.tsx
     • ProductUpsellPopup.tsx
     • SocialProofPopup.tsx
     • CountdownTimerPopup.tsx
     • AnnouncementPopup.tsx
Supporting/shared:

     • Hooks: app/domains/storefront/popups-new/hooks/
        • usePopupForm, useDiscountCode, useCountdownTimer, usePopupAnimation
     • Form fields: app/domains/storefront/popups-new/components/FormFields.tsx
        • EmailInput, NameInput, GdprCheckbox, SubmitButton
     • Types: app/domains/storefront/popups-new/types.ts
        • PopupDesignConfig, DiscountConfig, Prize, etc.
     • Container/trigger orchestration:
        • app/domains/storefront/shared/PopupManagerCore.ts
        • app/domains/storefront/shared/PopupManagerReact.tsx
     • Campaign content types (Zod):
     app/domains/campaigns/types/campaign.ts
        • NewsletterContentSchema, SpinToWinContentSchema, ScratchCardContentSchema,
       FreeShippingContentSchema, CartAbandonmentContentSchema, FlashSaleContentSchema, etc.

Legacy/admin preview layer (uses the same popup components):
• Template preview registry:
app/domains/popups/components/preview/template-preview-registry.tsx
• Legacy re‑exports:
app/domains/popups/components/index.ts

Other display types:

     • Slide‑in: app/domains/storefront/slideins/SlideInPopup.tsx
     • Banner: app/domains/storefront/notifications/BannerPopup.tsx
     • Social‑proof stream: app/domains/storefront/notifications/social-proof/...
These mostly reuse or parallel the popups but are less involved in lead capture.

1.2 Per‑popup summary (form, discount, logic vs UI)
Legend

     • Form implementation: fields, validation, GDPR.
     • Discount handling: how codes are generated/fetched/displayed.
     • Logic vs UI: where side effects and behavior live.


───────────────────────────────────────────────────────────────

NewsletterPopup

     • File: app/domains/storefront/popups-new/NewsletterPopup.tsx
     • Form:
        • Uses usePopupForm with PopupFormConfig populated from NewsletterConfig:
           • emailRequired, emailErrorMessage
           • nameFieldEnabled, nameFieldRequired
           • consentFieldEnabled, consentFieldRequired
           • campaignId, previewMode
        • UI uses shared components:
           • NameInput (optional, driven by nameFieldEnabled)
           • EmailInput
           • GdprCheckbox (optional, driven by consentFieldEnabled)
           • SubmitButton
        • Validation (centralized in usePopupForm):
           • Email required/optional + format.
           • Name required only if enabled+required.
           • GDPR required only if enabled+required.
     • Discount:
        • usePopupForm may produce a generatedDiscountCode (from secure /api/leads/submit).
        • useDiscountCode is initialized with:
           • generatedDiscountCode or, if none, config.discount.code when config.discount.enabled.
        • UI:
           • Renders a success state with inline markup:
              • “Your discount code:” label
              • A clickable code box that calls handleCopyCode()
              • “✓ Copied to clipboard!” message when copiedCode is true
           • Messaging varies with discount.deliveryMode (auto‑apply vs show‑in‑popup vs fallback).
     • Logic vs UI:
        • Business logic:
           • Submission, validation, secure lead capture, discount generation, copy‑to‑clipboard, animation.
           • All inside NewsletterPopup using usePopupForm, useDiscountCode, usePopupAnimation.
        • UI:
           • Large JSX component; layout, success/error states, content rendering mixed with the above.


────────────────────────────────────────────────────────────────────────────────────────────────────
SpinToWinPopup

     • File: SpinToWinPopup.tsx
     • Form:
        • Uses usePopupForm with:
           • emailRequired, emailPlaceholder, emailLabel
           • nameFieldEnabled ← config.collectName
           • nameFieldRequired
           • consentFieldEnabled ← config.showGdprCheckbox
           • consentFieldRequired
           • campaignId, previewMode
        • UI uses:
           • NameInput (if collectName)
           • EmailInput (if emailRequired)
           • GdprCheckbox (if showGdprCheckbox)
     • Discount:
        • useDiscountCode manages state.
        • When spinning:
           • Calls backend spin endpoint (with challenge token & session).
           • Backend returns prize + discountCode.
           • Component sets:
              • setWonPrize(prize)
              • setDiscountCode(generatedCode) via useDiscountCode.
        • In preview mode:
           • Picks a random segment and sets a mock PREVIEW10 code via setDiscountCode.
        • UI displays the code and copy affordance in the win state (inline markup + “Copied” feedback).
     • Logic vs UI:
        • Heavy logic inside the component:
           • Wheel physics (canvas, animation), prize selection, calling /spin API, code error handling, gating spin on form validity, etc.
        • UI:
           • All layout (wheel, result panel, form) is in the same component, but it composes shared hooks and form fields.

──────────────────────────────

ScratchCardPopup

     • File: ScratchCardPopup.tsx
     • Form:
        • Uses usePopupForm with:
           • emailRequired
           • consentFieldEnabled / consentFieldRequired from config.showGdprCheckbox
           • campaignId, previewMode
        • Uses EmailInput, GdprCheckbox, SubmitButton.
        • Multiple flows:
           • Email before scratch vs email after scratch (emailBeforeScratching flag).
     • Discount:
        • useDiscountCode manages code state + copy.
        • Prize and code retrieval:
           • Fetches prize from a backend endpoint using challenge token & session.
           • Response: success, prize, discountCode.
           • Sets wonPrize and later setDiscountCode(wonPrize.discountCode) via a useEffect.
        • Email-after-scratch flow:
           • Uses a specific save‑email endpoint, passing existing discountCode.
           • On success, may update setDiscountCode(data.discountCode) again.
        • UI:
           • Complex scratch card overlay with scenarios:
              • Show code immediately.
              • Show code only after email submitted.
              • Non‑discount prize text.
           • Uses inline markup for the code box and “Copy” button, plus instructions.
     • Logic vs UI:
        • Very logic-heavy component:
           • Canvas scratch rendering, prize fetching, separate email flow with additional API, code visibility rules.
        • UI:
           • Scratch card layout plus email form interwoven with above logic.


──────────────────────────────────────────────────────────────────────────

FreeShippingPopup
• File: FreeShippingPopup.tsx
• Form:
• Uses usePopupForm but only for email:
• emailRequired ← requireEmailToClaim
• campaignId, previewMode
• UI uses EmailInput + SubmitButton for the “claim” form.
• No name or GDPR fields at the moment (though design could support them).
• Discount:
• useDiscountCode used for:
• Codes coming from usePopupForm submission or
• Codes issued via issueDiscount callback once threshold reached.
• For non‑email‑gated flows:
• When threshold is reached and issueDiscount exists, issueDiscount is called, and returned code is passed to setDiscountCode.
• UI:
• In the bar: “Use code XYZ at checkout.” clickable, handleCopyCode() with “Copied!” feedback.
• Handles auto‑apply mode: if no code but discount is auto‑apply, shows a different message.
• Logic vs UI:
• Logic:
• Progress computation to threshold, discount issuance, gating on email, copy handling.
• UI:
• Progress bar, text, form markup, and discount text are defined inline in this component.

────────────────────────────────────────────

CartAbandonmentPopup

     • File: CartAbandonmentPopup.tsx
     • Form:
        • Uses usePopupForm for email recovery:
           • emailRequired = true
           • emailErrorMessage, campaignId, previewMode
        • UI: EmailInput + SubmitButton in the footer section.
        • No name or GDPR checkbox here currently.
     • Discount:
        • useDiscountCode manages code + copy.
        • Two flows:
           1. On “Resume checkout” CTA:
              • If config.discount.enabled and issueDiscount is provided and no discountCode yet:
                 • Computes cartSubtotalCents from cartTotal.
                 • Calls issueDiscount.
                 • Uses discountDeliveryMode (from discount.deliveryMode) to decide whether to show code in the popup or auto‑apply.
                 • Sets setDiscountCode(code) when appropriate.
           2. On email submission (if email recovery enabled):
              • Calls handleFormSubmit() (from usePopupForm).
              • If result.discountCode exists, calls setDiscountCode(result.discountCode).
        • UI:
           • Displays a “Your discount code” block at the bottom when discountCode is present, with its own copy UI (“Copy” button + value).
     • Logic vs UI:
        • Logic:
           • Countdown timer, discount issuing, redirect behavior, email recovery.
        • UI:
           • Cart items, totals, email form, discount block markup all mixed in the component.


───────────────────────────────────────────────────────────────────────────────────────────

FlashSalePopup

     • File: FlashSalePopup.tsx
     • Form:
        • No lead form (no usePopupForm, no email/name/GDPR).
     • Discount:
        • Uses useDiscountCode.
        • Receives issueDiscount prop from container (e.g., PopupManagerPreact/React).
        • On CTA click:
           • If discount is applicable and not yet claimed:
              • Calls issueDiscount({ cartSubtotalCents }).
              • If result has code, calls setDiscountCode(result.code).
              • Marks discount as claimed.
        • UI:
           • Banner and modal variants.
           • In both: “Use code XYZ at checkout” with clickable span and “Copied!” feedback.
     • Logic vs UI:
        • Logic:
           • Timer (useCountdownTimer), discount gating and issuance, inventory/“sold out” state.
        • UI:
           • Layout of banner/modal and discount text inline.


────────────────────────────────────────────────────────────────────────────────────────────────────────────

FreeShippingPopup (already covered), SpinToWinPopup, ScratchCardPopup, CartAbandonmentPopup, NewsletterPopup
These four (+ free shipping) are the main lead‑capture popups. All rely on:

     • usePopupForm (shared form logic).
     • useDiscountCode (shared discount state/copy logic).
     • EmailInput / NameInput / GdprCheckbox / SubmitButton (shared field components).

───────────────────────────────────────────────────────────────

ProductUpsellPopup

     • File: ProductUpsellPopup.tsx
     • Form:
        • No lead capture; purely about product selection and CTA.
     • Discount:
        • No explicit discount code logic in the file (no useDiscountCode).
        • Any discount logic is implicit via upsell pricing / bundle display.
     • Logic vs UI:
        • Logic:
           • Selection of upsell products, cart interactions via callbacks.
        • UI:
           • Card/grid layouts etc.


────────────────────────────────

SocialProofPopup

     • File: SocialProofPopup.tsx
     • Form:
        • None (no email/name/GDPR).
     • Discount:
        • None; just notifications/credibility messaging.
     • Logic vs UI:
        • Logic:
           • Cycling through notifications, timers.
        • UI:
           • Small corner notifications.


────────────────────────────────────────────────
CountdownTimerPopup / AnnouncementPopup / SlideInPopup / BannerPopup

     • Files:
        • CountdownTimerPopup.tsx
        • AnnouncementPopup.tsx
        • slideins/SlideInPopup.tsx
        • notifications/BannerPopup.tsx
     • Form:
        • No lead fields.
     • Discount:
        • May show content related to promotions but do not currently integrate with useDiscountCode.
     • Logic vs UI:
        • Primarily presentational plus countdown behavior; minimal central discount or form logic.

────────────────────────────────────────

2. Common patterns & inconsistencies

2.1 Common, already-centralized patterns

1. Lead capture logic (`usePopupForm`)
   • Lives in app/domains/storefront/popups-new/hooks/usePopupForm.ts.
   • Single source of truth for:
   • Form state (PopupFormData):
   • email: string
   • name?: string
   • gdprConsent: boolean
   • Errors (PopupFormErrors): email, name, gdpr.
   • Validation rules:
   • Email required/optional.
   • Name required if enabled+required.
   • GDPR required if enabled+required.
   • Submission behavior:
   • Optional onSubmit(data: PopupFormData) hook for custom flows (e.g., ScratchCard, FreeShipping).
   • Default secure submission (when campaignId is present) via submitWithChallengeToken to /apps/revenue-boost/api/leads/submit.
   • Special previewMode behavior (fake success, no network).
   • State machine:
   • isSubmitting, isSubmitted, generatedDiscountCode, errors, resetForm, etc.
2. Discount code state & copy behavior (`useDiscountCode`)

     • Lives in hooks/useDiscountCode.ts.
     • Standard interface:
        • discountCode, setDiscountCode
        • copiedCode, copyError
        • handleCopyCode, resetCopyState
     • Used consistently by:
        • NewsletterPopup, SpinToWinPopup, ScratchCardPopup,
        • FreeShippingPopup, CartAbandonmentPopup, FlashSalePopup.
     • Handles:
        • Clipboard interactions.
        • “Copied!” transient state.
        • Optional initial code from props.
3. Shared field components

     • EmailInput, NameInput, GdprCheckbox, SubmitButton in components/FormFields.tsx.
     • Provide consistent:
        • Visual styling (borders, colors, font sizes).
        • Accessibility (labels, error text with role="alert", aria-invalid, etc).
        • Error highlighting.

4. Shared design & content types

     • PopupDesignConfig in popups-new/types.ts:
        • Standardizes design fields: colors, sizes, positions, animation, custom CSS, background image config, overlay options.
     • Zod content schemas in campaign.ts:
        • NewsletterContentSchema (emailRequired, nameFieldEnabled, consentFieldEnabled, consentFieldRequired, consentFieldText…).
        • SpinToWinContentSchema (emailRequired, collectName, showGdprCheckbox, consentFieldRequired, gdprLabel…).
        • ScratchCardContentSchema (emailRequired, emailBeforeScratching, showGdprCheckbox, gdprLabel).
        • CartAbandonmentContentSchema (emailPlaceholder, emailErrorMessage, etc).
        • FreeShippingContentSchema (requireEmailToClaim, claimEmailPlaceholder, claimButtonLabel).
        • FlashSaleContentSchema and others for non‑lead popups.
5. Trigger & campaign management

     • PopupManagerCore / PopupManagerReact centralize:
        • Which campaign is active.
        • How triggers fire (time delay, scroll depth, exit intent, etc.).
        • Passing campaign.contentConfig + designConfig into specific popup components.
This is already a good base; the missing pieces are in UI composition and separation of concerns.
2.2 Inconsistencies and duplication

     1. Form UI is repeated per popup
        • Each popup with a form manually assembles:
           • Label text, placeholders.
           • Layout (stack vs grid vs single column).
           • Submit button label and placement.
        • EmailInput, NameInput, GdprCheckbox are reused, but the form as a whole is not.

     2. GDPR config naming varies
        • Newsletter content uses:
           • consentFieldEnabled, consentFieldRequired, consentFieldText.
        • Spin‑to‑win and Scratch card use:
           • showGdprCheckbox, consentFieldRequired, gdprLabel.
        • The hook usePopupForm normalizes only enabled/required flags; labels/text are handled ad‑hoc in each popup’s UI.
     3. Discount display markup is duplicated
        • Newsletter: “Your discount code” panel with its own markup and “Copied!” line.
        • Cart abandonment: a card‑style code block at the bottom.
        • Free shipping: inline “Use code XYZ at checkout” with “Copied!” suffix.
        • Flash sale: same pattern as free shipping, but repeated for banner vs modal.
        • Scratch card: overlay code inside the scratch area with its own layout.
        • All of these:
           • Use useDiscountCode under the hood.
           • Re‑implement the “click to copy + show copied state” pattern manually.
     4. Business logic and presentation are interwoven
        • NewsletterPopup, SpinToWinPopup, ScratchCardPopup, FreeShippingPopup, CartAbandonmentPopup, FlashSalePopup:
           • Contain both:
              • Heavy logic (API calls, timers, discount issuance, scratch/spin state machines).
              • All JSX markup and styling classes.
        • There is no clear “container vs presentational” split; instead, hooks are the only abstraction layer.
     5. Minor behavioral divergences
        • Email required behavior is sometimes over‑constrained by endpoint shapes:
           • usePopupForm enforces email even if emailRequired is false, when using the leads endpoint, to avoid invalid backend calls.
        • Different popups interpret discount delivery modes slightly differently (e.g., when to show code vs only auto‑apply).
These inconsistencies are mostly UI/behavior wiring, not underlying logic—ideal for the refactor you’re asking for.

──────────────────────────────────────────────

3. Proposed shared architecture & abstractions

3.1 Standardized lead capture form component
Goal: a single, configurable form component that encapsulates the Name / Email / GDPR UI and ties into usePopupForm without duplicating markup in every popup.
Location: app/domains/storefront/popups-new/components/LeadCaptureForm.tsx

Core idea:

     • Keep usePopupForm as the logic layer.
     • Introduce LeadCaptureForm as a pure / mostly dumb component that:
        • Receives form state (PopupFormData) and errors (PopupFormErrors).
        • Receives configuration flags (show/hide name & GDPR, labels, placeholders).
        • Calls callbacks for onEmailChange, onNameChange, onGdprChange, onSubmit.
        • Renders NameInput, EmailInput, GdprCheckbox, SubmitButton with consistent layout.

Example of a minimal props contract (conceptual):
export interface LeadCaptureFormProps {
data: PopupFormData;
errors: PopupFormErrors;
onChangeEmail: (value: string) => void;
onChangeName?: (value: string) => void;
onChangeGdpr?: (checked: boolean) => void;
onSubmit: () => void;
isSubmitting: boolean;
showName?: boolean;
showGdpr?: boolean;
labels?: { email?: string; name?: string; gdpr?: string; submit?: string };
placeholders?: { email?: string; name?: string };
}

Usage pattern:

     • In each popup container (e.g., NewsletterPopupContainer):
        • Call usePopupForm to get:
           • formState, errors, setEmail, setName, setGdprConsent, handleSubmit, isSubmitting.
        • Pass those to LeadCaptureForm along with:
           • showName, showGdpr derived from template content config.
           • labels and placeholders sourced from Zod content fields (emailPlaceholder, gdprLabel, etc).
     • The same LeadCaptureForm can be used in:
        • Newsletter, Spin‑to‑win, Scratch card, Free shipping bar, Cart abandonment (email recovery), and any future lead popups.
Extensibility for extra fields:

     • Plan ahead for future fields (e.g., preferences, phone).
     • LeadCaptureForm can accept something like:
        • extraFields?: React.ReactNode or a render prop to inject template‑specific inputs without changing the core contract.

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

3.2 Shared discount code display component

Goal: one component responsible for showing a discount code, handling copy‑to‑clipboard, and rendering consistent visual affordances, with variants for different contexts (inline, card, overlay).
Location: app/domains/storefront/popups-new/components/DiscountCodeDisplay.tsx

Core idea:
• Wrap the common patterns:
• A label (“Your discount code”, “Use code X at checkout”…).
• The code itself, styled consistently.
• The copy interaction (click area, “Copied” feedback).
• Optional helper text for auto‑apply‑only discounts.
Suggested props:

export interface DiscountCodeDisplayProps {
code: string | null;
copied: boolean;
onCopy: () => void;
label?: string;
helperText?: string;
variant?: "inline" | "card" | "overlay";
}

How it fits existing popups:

     • Newsletter:
        • Use variant="card"; label = “Your discount code:”.
     • Cart abandonment:
        • Use variant="card" but wrapped in the cart footer; label = “Your discount code”.
     • Free shipping bar:
        • Use variant="inline"; label = “Use code”; embed inside bar text.
     • Flash sale:
        • Use variant="inline" in both banner + modal.
     • Scratch card:
        • Use variant="overlay" inside the scratch card; the overlay container remains template‑specific, but the code + copy behavior is from DiscountCodeDisplay.
Thus you get a single base discount component with a small number of variants instead of each popup hand‑rolling its own discount UI.

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

3.3 Clear container vs view components per popup type

Goal: move business logic (form, discount, timers, API calls) out of the JSX‑heavy popup components into focused containers, and keep the popup views dumb and reusable across storefront + admin
preview.
Pattern (per popup type):

For each X in {Newsletter, SpinToWin, ScratchCard, FreeShipping, CartAbandonment, FlashSale, ...}:
• Container: XPopupContainer
• Responsibilities:
• Read config (design + content).
• Hook into:
• usePopupForm (if leads).
• useDiscountCode (if discount).
• useCountdownTimer, usePopupAnimation, custom logic as needed.
• Call backend APIs (spin, scratch, discount issuance, save email).
• Decide when to:
• Show forms vs success state vs error state.
• Show discount code vs auto‑apply messaging.
• Compose props for:
• LeadCaptureForm (or null if no form).
• DiscountCodeDisplay (or null if no discount).
• XPopupView (pure UI).
• Exported as the public XPopup for now, to preserve API:
• e.g., the current NewsletterPopup can become a thin wrapper over NewsletterPopupContainer + NewsletterPopupView.
• View component: XPopupView
• Responsibilities:
• Render layout and styling for the popup.
• Receive props like:
• config: XConfig (includes design + content).
• visible: boolean, onClose: () => void.
• formProps?: LeadCaptureFormProps.
• discountProps?: DiscountCodeDisplayProps.
• Any additional display state (e.g., timeRemaining, wonPrize, resultMessage).
• Use:
• PopupPortal, PopupGridContainer.
• LeadCaptureForm, DiscountCodeDisplay.
• Template‑specific static copy and imagery.

This gives you one place per template for logic, and makes the view layer almost purely presentational, reusable across React Router admin preview and storefront extension.

────────────────────────────────────────────

3.4 Type contracts to standardize

You already have most of the types you need:

     • Popup‑level config:
        • PopupDesignConfig (visual).
        • Zod content types (e.g., NewsletterContent, SpinToWinContent).
        • These already match the architecture described in your docs; no need to reinvent.

     • Standardized form types:
        • PopupFormData, PopupFormErrors, PopupFormConfig from usePopupForm should be the canonical contract for lead forms.
        • LeadCaptureFormProps should be expressed in terms of these.

     • Standardized discount props:
        • New DiscountCodeDisplayProps should be the only contract for discount display UI.
        • Each container maps its internal useDiscountCode state into DiscountCodeDisplayProps.
     • Shared popup interface for containers:
        • Keep using per‑template configs:
           • NewsletterConfig, SpinToWinConfig, ScratchCardConfig, etc.
        • Containers accept props already used by current components:
           • config, isVisible, onClose, plus any template‑specific callbacks (onSubmit, onWin, issueDiscount, etc).

─────────────────────────────────────────────────────

4. Generic pattern for all popups

4.1 “Parent container per popup type” pattern

For any popup that uses lead capture and/or discount:
1. Container:
• Combines:
• PopupDesignConfig + template content config into a single config object (already done via template preview registry / storefront mapping).
• usePopupForm (when needed).
• useDiscountCode (when needed).
• Any other hooks (useCountdownTimer, etc).
• Derives:
• formProps: LeadCaptureFormProps | undefined
• discountProps: DiscountCodeDisplayProps | undefined
• Additional display flags (e.g., showSuccess, showEmailAfterPrize).
• Handles side effects:
• Calling /api/leads/submit.
• Calling discount issuance endpoints with challenge tokens.
• Emitting tracking events.

     2. View:
        • Receives:
           • config, isVisible, onClose.
           • formProps, discountProps.
           • Extra display state (time remaining, prize, etc).
        • Renders:
           • PopupPortal, PopupGridContainer, etc.
           • LeadCaptureForm when formProps is provided.
           • DiscountCodeDisplay when discountProps is provided.
           • Any additional UI (wheel, scratch canvas, cart items, etc).
4.2 Benefits

     • Logic reuse:
        • All lead capture submission and GDPR validation live in usePopupForm and container code.
        • All discount lifecycle (store/update code, copy, show/hide) live in useDiscountCode + containers + a single discount component.
     • UI consistency:
        • Same lead form appearance (labels, error styling, button structure) across templates.
        • Same discount code copy experience (same “Copied!” behavior, keyboard/focus behavior) across templates.
     • Easier to add new popup types:
        • For a new template that needs leads and/or discounts:
           • Define its content schema in campaign.ts (reusing email/GDPR fields).
           • Create NewTemplatePopupView (layout).
           • Create NewTemplatePopupContainer that:
              • Uses usePopupForm + useDiscountCode as appropriate.
              • Assembles LeadCaptureFormProps and DiscountCodeDisplayProps.
           • Register in template preview registry and storefront mapping.

───────────────────────────────────────────────────────────

5. Refactoring / migration plan

5.1 Step 1 – Solidify shared logic (no API changes)

     1. Document and test `usePopupForm` and `useDiscountCode`
        • Add/extend unit tests in tests/unit to cover:
           • Validation branches (email optional/required, name required, GDPR required).
           • Submission paths (preview vs real submission).
           • Error paths (missing campaignId, server error).
           • Discount code behavior (generated code vs pre‑provided code; copy success/failure).
        • This ensures we can safely refactor UI around them.
     2. Minor type cleanups (optional but recommended)
        • Ensure all lead‑capture templates use the same conceptual fields:
           • Email: emailRequired, emailPlaceholder, emailLabel.
           • Name: collectName | nameFieldEnabled, nameFieldRequired, nameFieldPlaceholder.
           • GDPR: consentFieldEnabled or showGdprCheckbox, consentFieldRequired, label text (consentFieldText / gdprLabel).
        • You don’t have to rename schema fields (to avoid migrations) – just provide a small mapping in each container when building LeadCaptureForm labels.
5.2 Step 2 – Introduce shared UI components

     1. Create `LeadCaptureForm`
        • Implement it in popups-new/components/LeadCaptureForm.tsx using:
           • EmailInput, NameInput, GdprCheckbox, SubmitButton.
        • Take props based on PopupFormData/PopupFormErrors and simple config flags.
        • Minimal logic: just call callbacks; no side effects.

     2. Create `DiscountCodeDisplay`
        • Implement in popups-new/components/DiscountCodeDisplay.tsx.
        • Support variant prop (inline, card, overlay) to cover current use cases.
        • Use onCopy handler from useDiscountCode.
     3. Add tests
        • Simple unit tests:
           • LeadCaptureForm renders fields based on flags and passes onSubmit on form submit.
           • DiscountCodeDisplay renders code, calls onCopy, shows copied helper text.

At this point, no existing popup is changed, so no behavior regression.
5.3 Step 3 – Refactor popups to use shared components (low risk → higher risk)

Order suggestion (minimize risk):
1. NewsletterPopup
• Replace inline <form> that uses NameInput / EmailInput / GdprCheckbox with <LeadCaptureForm />.
• Replace its discount success block with <DiscountCodeDisplay />.
• Keep the rest of layout intact.
• This becomes the canonical reference implementation.

     2. FreeShippingPopup
        • Replace email claim form with LeadCaptureForm (only email field visible).
        • Replace inline “Use code XYZ” text with DiscountCodeDisplay (inline variant).

     3. CartAbandonmentPopup
        • Replace email recovery form with LeadCaptureForm (email only).
        • Replace the bottom discount code card with DiscountCodeDisplay (card variant).
     4. FlashSalePopup
        • Replace both banner + modal discount mentions with DiscountCodeDisplay (inline variant).
     5. SpinToWinPopup
        • Replace form section with LeadCaptureForm (name + email + GDPR).
        • Use DiscountCodeDisplay in the win/result panel where code is shown.
     6. ScratchCardPopup
        • Replace email form regions (before scratch + after scratch) with LeadCaptureForm.
        • For the code overlay, replace the code piece with DiscountCodeDisplay (overlay variant) while keeping the surrounding scratch card container.
Each step should be done with no changes to `config` shape or external API of the popup component.
5.4 Step 4 – Introduce container/view split

     1. For each popup above (starting with Newsletter, then FreeShipping, CartAbandonment, FlashSale, SpinToWin, ScratchCard):
        • Create `XPopupView`:
           • Move JSX-only layout & styling from the existing popup into this component.
           • Replace internal calls to hooks with props (formProps, discountProps, etc.).
        • Create `XPopupContainer`:
           • Keep current hook usage and business logic.
           • Prepare view props and render <XPopupView {...props} />.
     2. For external users:
        • Keep exporting XPopup from existing files as the container (so imports from ~/domains/storefront/popups-new do not change).
        • Admin preview (template-preview-registry.tsx) and storefront PopupManagerReact can continue to render XPopup without noticing the split.
This step is mostly internal restructuring; types and APIs at the call sites stay stable.

5.5 Backwards compatibility & breaking changes
• Props / config:
• Keep all existing popup props (config, isVisible, onClose, etc.) unchanged.
• Do not alter NewsletterConfig, SpinToWinConfig, etc. during this refactor.
• CSS / DOM structure:
• Some DOM structure changes are inevitable (due to new shared components).
• To minimize risk:
• Preserve key class names on container elements (e.g., email-popup-discount, cart-ab-code-block), possibly by letting LeadCaptureForm / DiscountCodeDisplay accept className/wrapperClassName
props.
• Avoid renaming data attributes used in analytics (data-splitpop, data-template, etc.).
• Storefront extension (Preact):
• extensions/storefront-src/core/PopupManagerPreact.tsx already uses shared backend services for issueDiscount.
• As long as React popup props don’t change, the Preact layer is mostly unaffected.
• If there is duplicated markup in Preact versions of popups, you can later mirror the same LeadCaptureForm/DiscountCodeDisplay pattern there.
5.6 Testing & validation

     1. Unit tests:
        • For usePopupForm and useDiscountCode (if not already covered).
        • For LeadCaptureForm and DiscountCodeDisplay.

     2. Integration tests:
        • For each lead popup:
           • Fill form, submit, ensure:
              • Validation messages appear correctly.
              • Success state appears.
              • Discount code is shown or auto‑apply message appears as expected.
           • Trigger discount flows:
              • For FreeShipping/CartAbandonment/FlashSale, simulate issueDiscount responses.
        • Add tests to tests/integration or enhance existing ones.
     3. E2E tests (Playwright):
        • For key flows (Newsletter, SpinToWin, ScratchCard, FreeShipping, CartAbandonment, FlashSale):
           • Ensure:
              • Popups appear according to triggers.
              • Submitting forms produces correct behavior.
              • Clicking discount code copies it to clipboard (can assert that a “Copied!” message appears).
        • Use existing commands:
           • npm run test:e2e
           • Or targeted tests if there are existing scenarios.
     4. Visual checks:
        • Use the admin template preview (TemplatePreview) to visually compare before/after for each template.

───────────────────────────────────────────────────

6. Recommendations & design decisions

6.1 Unified Name/Email/GDPR form – is it realistic?
Yes, for all current lead‑capture popups:

     • The logic is already unified in usePopupForm with PopupFormData = { email, name?, gdprConsent }.
     • Templates that don’t currently show name or GDPR (e.g., FreeShipping, CartAbandonment) can use the same form component with showName=false, showGdpr=false.
     • Templates with multi‑step or complex flows (e.g., ScratchCard) still use the same underlying fields; only the timing of submission changes, which lives in the container, not in the shared form.
Potential exceptions:

     • Future templates might require extra fields (e.g., phone, preferences, survey questions).
        • This is best addressed by letting LeadCaptureForm accept an extraFields slot or similar, not by diverging from the Name/Email/GDPR base contract.
6.2 Single discount code component vs base + variants

A single base `DiscountCodeDisplay` component with a small `variant` prop is sufficient:
• Inline usage (FreeShipping, FlashSale).
• Card/block usage (Newsletter success view, CartAbandonment).
• Overlay styling (ScratchCard over the scratch area).

For highly specialized visuals (e.g., ScratchCard’s overlay), you can:
• Wrap DiscountCodeDisplay in a template‑specific wrapper (e.g., ScratchCardDiscountOverlay) that just positions it on top of the card.
This keeps:

     • Behavior (copy, “Copied!” state, accessibility) centralized.
     • Markup differences limited to container wrappers and variant styling, not copy logic.
6.3 Parent container per popup – right level of abstraction?

Given the codebase:

     • You already have hooks that centralize cross‑cutting logic.
     • Popups still have a lot of template‑specific behavior (e.g., wheel spin, scratch flows, free‑shipping thresholds).
A per‑template container (one container per popup type) is the right level:

     • It keeps complex behavior close to the template that needs it.
     • It avoids a too‑generic “super‑container” that must understand:
        • All discount delivery modes.
        • Every lead flow variant.
        • Every visual layout.

A more generic layer (e.g., a single LeadCaptureDiscountPopupContainer driving multiple templates) is possible later, but:
• It risks over‑generalizing and making behavior hard to reason about.
• It provides limited benefit beyond what usePopupForm + useDiscountCode + LeadCaptureForm already give.
So I recommend:

     • Now: Introduce LeadCaptureForm + DiscountCodeDisplay + per‑template containers/views.
     • Later (optional): If you see strong convergence in container behavior between templates (e.g., Newsletter + SpinToWin share the exact same lead+discount flow), consider a shared
       LeadCapturePopupContainer they both use.

───────────────────────────────────────────────────────────────────────────

7. Concrete next steps (summary)

     1. Codify existing logic with tests for usePopupForm and useDiscountCode.
     2. Introduce shared UI components:
        • LeadCaptureForm (Name/Email/GDPR).
        • DiscountCodeDisplay (code + copy + variants).
     3. Refactor popups in this order:
        • Newsletter → FreeShipping → CartAbandonment → FlashSale → SpinToWin → ScratchCard.
        • Replace local forms & discount markup with shared components.
     4. Split container/view per popup type, keeping exports stable.
     5. Run unit, integration, and E2E tests to catch any regressions and visually validate template previews.
If you’d like, I can next sketch concrete prop shapes and a sample `NewsletterPopupContainer`/`View` to make the migration even more straightforward
