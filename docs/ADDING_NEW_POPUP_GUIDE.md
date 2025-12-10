# Adding a New Popup Template Guide

This guide walks you through creating a new popup template using the shared components and established patterns.

## Prerequisites

Before creating a new popup:
1. Review `SHARED_COMPONENTS_GUIDE.md` to understand available components
2. Check `ARCHITECTURE_DIAGRAM.md` for system architecture
3. Understand the template-driven architecture in `docs/TYPE_SYSTEM_DIAGRAM.md`

## Step-by-Step Guide

### Step 1: Add TemplateType to Prisma Schema

First, add your new template type to the Prisma enum in `prisma/schema.prisma`:

```prisma
enum TemplateType {
  // ... existing types
  MY_TEMPLATE
}
```

Then run the migration:
```bash
npx prisma migrate dev --name add_my_template_type
```

### Step 2: Define Content Schema

Add your template's content schema to `app/domains/campaigns/types/campaign.ts`:

```typescript
// 1. Define the content schema with Zod
export const MyTemplateContentSchema = BaseContentConfigSchema.extend({
  id: z.string().optional(),
  headline: z.string().min(1, "Headline is required"),
  subheadline: z.string().optional(),
  buttonText: z.string().default("Click Here"),
  // Add template-specific fields
  customField: z.string().optional(),
});

// 2. Infer TypeScript type
export type MyTemplateContent = z.infer<typeof MyTemplateContentSchema>;

// 3. Add to TemplateType enum (must match Prisma enum)
export const TemplateTypeSchema = z.enum([
  // ... existing types
  "MY_TEMPLATE",
]);
```

### Step 3: Create Popup Component

Create `app/domains/storefront/popups-new/MyTemplatePopup.tsx`:

```typescript
/**
 * MyTemplatePopup Component
 *
 * Brief description of what this popup does.
 * Key features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */

import React from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig } from "./types";
import type { MyTemplateContent } from "~/domains/campaigns/types/campaign";

// Import custom hooks
import { usePopupAnimation, usePopupForm } from "./hooks";

// Import shared components
import {
  PopupHeader,
  LeadCaptureForm,
  SuccessState,
  CloseIcon,
} from "./components/shared";

// Import shared animations
import "./components/shared/animations.css";

/**
 * Config interface - extends both design and content
 */
export interface MyTemplateConfig extends PopupDesignConfig, MyTemplateContent {
  // Add storefront-specific fields only (not in content schema)
  customStorefrontField?: string;
}

export interface MyTemplatePopupProps {
  config: MyTemplateConfig;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (email: string) => Promise<void>;
}

export const MyTemplatePopup: React.FC<MyTemplatePopupProps> = ({
  config,
  isVisible,
  onClose,
  onSubmit,
}) => {
  // Use animation hook
  const { showContent } = usePopupAnimation({ isVisible });

  // Use form hook (if needed)
  const {
    formState,
    setEmail,
    setGdprConsent,
    errors,
    handleSubmit,
    isSubmitting,
    isSubmitted,
  } = usePopupForm({
    config: {
      emailRequired: true,
      consentFieldEnabled: false,
      campaignId: config.campaignId,
      previewMode: config.previewMode,
    },
    onSubmit: onSubmit
      ? async (data) => {
          await onSubmit(data.email);
          return undefined;
        }
      : undefined,
  });

  if (!isVisible) return null;

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backgroundColor={config.backgroundColor}
      position="center"
      size={config.size || "medium"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.headline || "Popup"}
    >
      <div className="my-template-popup">
        {/* Close button */}
        {config.showCloseButton !== false && (
          <button
            className="my-template-close"
            onClick={onClose}
            aria-label="Close popup"
          >
            <CloseIcon size={20} color={config.textColor} />
          </button>
        )}

        {/* Header */}
        <PopupHeader
          headline={config.headline}
          subheadline={config.subheadline}
          textColor={config.textColor}
          align="center"
        />

        {/* Content */}
        {!isSubmitted ? (
          <LeadCaptureForm
            data={formState}
            errors={errors}
            onEmailChange={setEmail}
            onNameChange={() => {}}
            onGdprChange={setGdprConsent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showName={false}
            showGdpr={false}
            labels={{
              email: "Email Address",
              submit: config.buttonText || "Submit",
            }}
            placeholders={{
              email: "you@example.com",
            }}
            accentColor={config.buttonColor}
            textColor={config.textColor}
            backgroundColor={config.inputBackgroundColor}
          />
        ) : (
          <SuccessState
            message="Thanks! Check your email."
            animation="bounce"
            accentColor={config.buttonColor}
            textColor={config.textColor}
          />
        )}
      </div>
    </PopupPortal>
  );
};
```

### Step 4: Export from Index

Add your popup to `app/domains/storefront/popups-new/index.ts`:

```typescript
export { MyTemplatePopup } from "./MyTemplatePopup";
export type { MyTemplateConfig, MyTemplatePopupProps } from "./MyTemplatePopup";
```

### Step 5: Add Styling

Add CSS for your popup (inline in component or separate file):

```tsx
<style>{`
  .my-template-popup {
    position: relative;
    padding: ${POPUP_SPACING.container.default};
  }

  .my-template-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .my-template-close:hover {
    opacity: 1;
  }

  /* Add responsive styles */
  @media (max-width: 640px) {
    .my-template-popup {
      padding: ${POPUP_SPACING.container.mobile};
    }
  }
`}</style>
```

**Best practices:**
- Use `POPUP_SPACING` constants for consistent spacing
- Add responsive breakpoints
- Support `prefers-reduced-motion`
- Use CSS custom properties for theming

### Step 6: Create Content Section Component

Create `app/domains/campaigns/components/content-sections/MyTemplateContent.tsx`:

```typescript
import React from "react";
import { FormField } from "~/domains/campaigns/components/FormField";
import type { MyTemplateContent } from "~/domains/campaigns/types/campaign";

interface MyTemplateContentProps {
  value: Partial<MyTemplateContent>;
  onChange: (value: Partial<MyTemplateContent>) => void;
  errors?: Record<string, string>;
}

export const MyTemplateContentSection: React.FC<MyTemplateContentProps> = ({
  value,
  onChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <FormField
        label="Headline"
        required
        error={errors?.headline}
      >
        <input
          type="text"
          value={value.headline || ""}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
          placeholder="Enter headline"
        />
      </FormField>

      <FormField
        label="Subheadline"
        error={errors?.subheadline}
      >
        <input
          type="text"
          value={value.subheadline || ""}
          onChange={(e) => onChange({ ...value, subheadline: e.target.value })}
          placeholder="Enter subheadline (optional)"
        />
      </FormField>

      <FormField
        label="Button Text"
        error={errors?.buttonText}
      >
        <input
          type="text"
          value={value.buttonText || "Click Here"}
          onChange={(e) => onChange({ ...value, buttonText: e.target.value })}
          placeholder="Click Here"
        />
      </FormField>
    </div>
  );
};
```

### Step 7: Register in Step Renderers

Add your content section to `app/domains/campaigns/utils/step-renderers.tsx`:

```typescript
import { MyTemplateContentSection } from "../components/content-sections/MyTemplateContent";

// In renderContentStep function:
case "MY_TEMPLATE":
  return (
    <MyTemplateContentSection
      value={contentConfig as Partial<MyTemplateContent>}
      onChange={onContentChange}
      errors={errors}
    />
  );
```

### Step 8: Add to Template Preview Registry

Add your popup to `app/domains/popups/components/preview/template-preview-registry.tsx`:

```typescript
import { MyTemplatePopup } from "~/domains/storefront/popups-new";
import type { MyTemplateConfig } from "~/domains/storefront/popups-new";

// Add to the registry
TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.MY_TEMPLATE] = {
  component: MyTemplatePopup,
  buildConfig: (
    mergedConfig: Record<string, unknown>,
    designConfig: Partial<PopupDesignConfig>
  ): MyTemplateConfig => ({
    id: "preview-my-template",
    headline: (mergedConfig.headline as string) || "Default Headline",
    subheadline: (mergedConfig.subheadline as string) || "",
    buttonText: (mergedConfig.buttonText as string) || "Click Here",
    customField: (mergedConfig.customField as string) || "",
    ...buildCommonConfig(mergedConfig, designConfig),
  }),
};
```

**⚠️ IMPORTANT: For product/upsell popups**, you MUST include mock products in the buildConfig:

```typescript
// For popups that display products, include mock data for preview:
products: (mergedConfig.products as typeof PRODUCT_UPSELL_PREVIEW_PRODUCTS) || PRODUCT_UPSELL_PREVIEW_PRODUCTS.slice(0, 1),
```

The `PRODUCT_UPSELL_PREVIEW_PRODUCTS` constant is defined at the top of the registry file and contains mock product data for previews. Use `.slice(0, N)` to control how many products appear (e.g., bundle popups need 3+ products).

### Step 8.1: Add Special Handling in TemplatePreview.tsx (If Needed)

If your popup requires special callbacks (like `onAddToCart`, `onSubmit`, `issueDiscount`), you must add special handling in `app/domains/popups/components/preview/TemplatePreview.tsx`.

**For upsell/product popups needing `onAddToCart`:**

```typescript
// 1. Import your config type at the top of the file
import type { MyTemplateConfig } from "~/domains/storefront/popups-new";

// 2. Add to the upsellVariantTypes array (if it's an upsell variant)
const upsellVariantTypes = [
  TemplateTypeEnum.CLASSIC_UPSELL,
  TemplateTypeEnum.MINIMAL_SLIDE_UP,
  // ... existing types
  TemplateTypeEnum.MY_TEMPLATE,  // <-- Add here
] as const;

// OR for completely new template types, add a separate handler block:
if (templateType === TemplateTypeEnum.MY_TEMPLATE) {
  const myConfig = componentConfig as MyTemplateConfig;

  const previewOnAddToCart = async (productIds: string[]): Promise<void> => {
    console.log("[TemplatePreview][MyTemplate] Preview add to cart", { productIds });
    await new Promise((resolve) => setTimeout(resolve, 400));
  };

  return (
    <PreviewContainer scopedStylesNode={scopedStylesNode}>
      <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
        <PreviewComponent
          config={myConfig}
          isVisible={externalIsVisible}
          onClose={handleClose}
          onAddToCart={previewOnAddToCart}
        />
      </div>
    </PreviewContainer>
  );
}
```

**Common callbacks by popup type:**
- **Email capture popups**: `onSubmit` - returns discount code or undefined
- **Product upsell popups**: `onAddToCart` - adds products to cart
- **Flash sale popups**: `issueDiscount` - issues discount code
- **Free shipping popups**: `issueDiscount` + cart total mock data
- **Social proof popups**: `notifications` - mock notification data

### Step 9: Create Storefront Bundle

Create `extensions/storefront-src/bundles/my-template.ts`:

```typescript
/**
 * My Template Popup Bundle
 * IIFE bundle that registers the popup component for storefront rendering.
 */
import { MyTemplatePopup } from "../../../app/domains/storefront/popups-new/MyTemplatePopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown> };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["MY_TEMPLATE"] = MyTemplatePopup;
})();
```

### Step 10: Update Component Loader

Add your template type to `extensions/storefront-src/core/component-loader.ts`:

```typescript
export type TemplateType =
  | "NEWSLETTER"
  // ... existing types
  | "MY_TEMPLATE";
```

### Step 11: Update Build Script

Add your bundle to `scripts/build-storefront.js` in the `popupBundles` array:

```javascript
const popupBundles = [
  // ... existing bundles
  "my-template", // MY_TEMPLATE
];
```

**Note:** The bundle name should be the kebab-case version of your template type (e.g., `MY_TEMPLATE` → `my-template`). This is what the component loader uses to map template types to bundle files.

After updating, run the build to verify:
```bash
npm run build:storefront
```

You should see your new bundle in the output with a size (e.g., `my-template.bundle.js: 24.5 KB`).

### Step 12: Seed Template Data

Add template to `prisma/seed.ts` or template data file:

```typescript
{
  name: "My Template",
  templateType: "MY_TEMPLATE",
  description: "Brief description of what this template does",
  category: "ENGAGEMENT", // or REVENUE, NEWSLETTER
  goals: ["ENGAGEMENT"],
  isPremium: false,
  contentConfig: {
    headline: "Default Headline",
    subheadline: "Default subheadline",
    buttonText: "Click Here",
  },
  designConfig: {
    // Default design settings
  },
}
```

### Step 12: Write Unit Tests

Create `tests/unit/domains/storefront/popups-new/MyTemplatePopup.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyTemplatePopup } from "~/domains/storefront/popups-new/MyTemplatePopup";

describe("MyTemplatePopup", () => {
  const defaultConfig = {
    campaignId: "test-campaign",
    headline: "Test Headline",
    subheadline: "Test Subheadline",
    buttonText: "Submit",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#3B82F6",
    buttonTextColor: "#ffffff",
  };

  it("renders headline and subheadline", () => {
    render(
      <MyTemplatePopup
        config={defaultConfig}
        isVisible={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Test Headline")).toBeInTheDocument();
    expect(screen.getByText("Test Subheadline")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <MyTemplatePopup
        config={defaultConfig}
        isVisible={true}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText("Close popup"));
    expect(onClose).toHaveBeenCalled();
  });

  it("submits form with email", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <MyTemplatePopup
        config={defaultConfig}
        isVisible={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    await screen.findByText("Thanks! Check your email.");
    expect(onSubmit).toHaveBeenCalledWith("test@example.com");
  });
});
```

### Step 13: Add E2E Tests (Optional)

Create `tests/e2e/staging/storefront-my-template.spec.ts` for critical flows.

---

## Checklist

Before submitting your new popup:

**Schema & Types:**
- [ ] TemplateType added to Prisma schema and migration run
- [ ] Content schema defined in `campaign.ts` with Zod

**Popup Component:**
- [ ] Popup component created with TypeScript types
- [ ] Popup exported from `index.ts`
- [ ] Shared components used where appropriate
- [ ] Styling follows spacing guidelines

**Admin UI:**
- [ ] Content section component created
- [ ] Registered in step renderers

**Preview System:**
- [ ] Added to template preview registry with correct buildConfig
- [ ] Mock data included (e.g., `products` for upsell popups)
- [ ] Special handling added in TemplatePreview.tsx (if callbacks needed)

**Storefront Integration:**
- [ ] Storefront bundle file created (`extensions/storefront-src/bundles/`)
- [ ] Component loader updated with new template type
- [ ] Build script updated (`scripts/build-storefront.js`)
- [ ] `npm run build:storefront` produces the new bundle

**Database & Testing:**
- [ ] Template seeded in database
- [ ] Unit tests written (>80% coverage)
- [ ] E2E tests for critical flows
- [ ] All tests passing (`npm run typecheck && npm run lint`)

---

## Common Patterns

### Email Capture with Success State

```tsx
{!isSubmitted ? (
  <LeadCaptureForm {...formProps} />
) : (
  <SuccessState
    message="Success!"
    discountCode={discountCode}
    onCopyCode={handleCopyCode}
    copiedCode={copied}
  />
)}
```

### Countdown Timer with Urgency

```tsx
<TimerDisplay
  timeRemaining={timeRemaining}
  format="compact"
  textColor={config.textColor}
/>
```

### Discount Code Display

```tsx
<DiscountCodeDisplay
  code={discountCode}
  onCopy={handleCopyCode}
  copied={copied}
  variant="dashed"
  size="lg"
/>
```

---

## Tips & Best Practices

### DO:
✅ Use shared components for common patterns
✅ Follow existing naming conventions
✅ Add comprehensive JSDoc comments
✅ Write unit tests for all functionality
✅ Use TypeScript strictly (no `any` types)
✅ Support accessibility (ARIA labels, keyboard navigation)
✅ Respect `prefers-reduced-motion`
✅ Use `PopupDesignConfig` for theming
✅ Follow spacing guidelines (`POPUP_SPACING`)

### DON'T:
❌ Duplicate code from other popups
❌ Hardcode colors or spacing values
❌ Skip error handling
❌ Forget responsive design
❌ Ignore accessibility
❌ Create custom components for common patterns
❌ Mix content and design configuration

---

## Troubleshooting

### Issue: Popup shows blank/empty in preview
**Most common cause:** Missing mock data or special handling.

For product/upsell popups:
1. Ensure `products` field is included in `buildConfig` in `template-preview-registry.tsx`:
   ```typescript
   products: (mergedConfig.products as typeof PRODUCT_UPSELL_PREVIEW_PRODUCTS) || PRODUCT_UPSELL_PREVIEW_PRODUCTS.slice(0, 1),
   ```
2. Add special handling in `TemplatePreview.tsx` to provide `onAddToCart` callback
3. Check if your popup component returns `null` when `products` is empty

### Issue: Popup doesn't appear
- Check `isVisible` prop is true
- Verify `PopupPortal` is rendering
- Check z-index conflicts

### Issue: React warning "Cannot update a component while rendering"
This occurs when calling callbacks (like `onClose`) inside state update functions:
```typescript
// ❌ BAD - calling onClose inside setTimeLeft callback
setTimeLeft((prev) => {
  if (prev <= 0) {
    onClose(); // This causes the warning!
    return 0;
  }
  return prev - 1;
});

// ✅ GOOD - use separate useEffect to handle side effects
useEffect(() => {
  if (timeLeft === 0 && isVisible) {
    onClose();
  }
}, [timeLeft, isVisible, onClose]);
```

### Issue: Form submission fails
- Verify `onSubmit` handler is provided
- Check `usePopupForm` configuration
- Review error handling in form

### Issue: Styling looks wrong
- Check `PopupDesignConfig` values
- Verify CSS specificity
- Test in different viewports

### Issue: Bundle not built for storefront
- Verify bundle file exists in `extensions/storefront-src/bundles/`
- Check bundle is added to `popupBundles` array in `scripts/build-storefront.js`
- Run `npm run build:storefront` and check output

### Issue: Tests failing
- Check test selectors match component structure
- Verify mock data matches schema
- Review async operations (use `await` and `findBy*`)

---

## Resources

- **Shared Components Guide**: `docs/SHARED_COMPONENTS_GUIDE.md`
- **Architecture Diagram**: `docs/ARCHITECTURE_DIAGRAM.md`
- **Type System**: `docs/TYPE_SYSTEM_DIAGRAM.md`
- **Refactoring Plan**: `docs/UI_REFACTORING_PLAN.md`
- **Example Popups**: `app/domains/storefront/popups-new/NewsletterPopup.tsx`

---

## Getting Help

If you need help:
1. Review existing popup implementations
2. Check shared component documentation
3. Review unit tests for examples
4. Ask the team for guidance

Happy coding! 🚀


