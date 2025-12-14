# Multi-Step Forms & Quiz Builder

> Priority: P1 | Impact: 🔥🔥🔥🔥 | Effort: High

## Summary

Add multi-step popup forms with conditional logic for quizzes, surveys, and progressive profiling. ConvertFlow, Sleeknote, and OptinMonster offer this as a major differentiator. Quizzes segment visitors and recommend products, driving 2-4x higher conversions.

## Why

- Quiz funnels convert 2-4x better than static popups
- Enables product recommendations based on answers
- Collects valuable zero-party data for personalization
- Major competitive gap: no Shopify popup app does this well
- Positions Revenue Boost as enterprise-grade solution

## User Stories

- As a merchant, I want to create product finder quizzes ("What's your skin type?")
- As a merchant, I want to segment visitors based on quiz answers
- As a merchant, I want to show personalized discounts based on responses
- As a visitor, I want an engaging quiz that helps me find the right product

## Implementation Tasks

### Phase 1: Basic Multi-Step (MVP)
- [ ] Add `QUIZ` and `MULTI_STEP_FORM` template types
- [ ] Create step-based form schema
- [ ] Build step navigation UI (progress bar, back/next)
- [ ] Support 2-5 linear steps
- [ ] Final step: email capture + result

### Phase 2: Conditional Logic
- [ ] Add conditional branching rules
- [ ] "If answer is X, go to step Y"
- [ ] Skip logic for irrelevant questions
- [ ] Dynamic result based on answer combination

### Phase 3: Product Recommendations
- [ ] Map quiz answers to product tags/collections
- [ ] Show recommended products on result step
- [ ] Add-to-cart from result popup
- [ ] Track quiz-to-purchase attribution

### Phase 4: Admin Builder
- [ ] Visual step builder UI
- [ ] Drag-and-drop question reordering
- [ ] Preview quiz flow
- [ ] Test mode for merchants

## Technical Design

### New Template Types

```typescript
export const TemplateTypeSchema = z.enum([
  // existing...
  "QUIZ",           // Product finder quiz
  "MULTI_STEP_FORM", // General multi-step form
  "SURVEY",         // Post-purchase survey (NPS, feedback)
]);
```

### Quiz Content Schema

```typescript
export const QuizContentSchema = z.object({
  // Quiz metadata
  quizTitle: z.string(),
  quizDescription: z.string().optional(),
  
  // Steps
  steps: z.array(QuizStepSchema).min(2).max(5),
  
  // Final step config
  resultConfig: QuizResultConfigSchema,
  
  // Lead capture
  collectEmail: z.boolean().default(true),
  emailStepPosition: z.enum(["before_result", "after_result"]).default("before_result"),
});
```

### Quiz Step Schema

```typescript
export const QuizStepSchema = z.object({
  id: z.string(),
  type: z.enum(["single_choice", "multiple_choice", "image_choice", "slider"]),
  question: z.string(),
  description: z.string().optional(),
  
  // Answer options
  options: z.array(QuizOptionSchema),
  
  // Conditional logic (Phase 2)
  conditionalRules: z.array(ConditionalRuleSchema).optional(),
});

export const QuizOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  image: z.string().optional(), // For image-based choices
  value: z.string(), // For result mapping
  tags: z.array(z.string()).optional(), // Product tags to match
});
```

### Conditional Logic Schema

```typescript
export const ConditionalRuleSchema = z.object({
  // If this option is selected...
  sourceStepId: z.string(),
  sourceOptionId: z.string(),
  
  // Then do this...
  action: z.enum(["go_to_step", "skip_step", "show_result"]),
  targetStepId: z.string().optional(),
});
```

### Quiz Result Schema

```typescript
export const QuizResultConfigSchema = z.object({
  // Result display
  resultTitle: z.string().default("Your Results"),
  showProductRecommendations: z.boolean().default(true),
  maxProducts: z.number().default(3),
  
  // Result mapping rules
  resultRules: z.array(ResultRuleSchema),
  
  // CTA
  ctaText: z.string().default("Shop Now"),
  ctaAction: z.enum(["link", "add_to_cart", "show_discount"]),
});
```

## UI Design

### Quiz Popup Flow

```
Step 1/3                          Step 2/3
┌─────────────────────┐          ┌─────────────────────┐
│ What's your         │          │ What's your main    │
│ skin type?          │          │ concern?            │
│                     │          │                     │
│ ○ Dry               │   →      │ ○ Anti-aging        │
│ ○ Oily              │          │ ○ Hydration         │
│ ○ Combination       │          │ ○ Acne              │
│ ○ Sensitive         │          │ ○ Brightening       │
│                     │          │                     │
│ [●○○] [Next →]      │          │ [●●○] [← Back][Next]│
└─────────────────────┘          └─────────────────────┘

Result Step
┌─────────────────────────────────┐
│ 🎉 Your Perfect Match!          │
│                                 │
│ Based on your answers:          │
│ Dry skin + Hydration focus      │
│                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ 💧  │ │ 🧴  │ │ ✨  │        │
│ │Serum│ │Cream│ │ Oil │        │
│ │ $45 │ │ $38 │ │ $32 │        │
│ └─────┘ └─────┘ └─────┘        │
│                                 │
│ Get 15% off these products!     │
│ Email: [________________]       │
│ [Get My Discount]               │
└─────────────────────────────────┘
```

## Data Model

### Quiz Response Storage

```prisma
model QuizResponse {
  id          String   @id @default(cuid())
  leadId      String
  campaignId  String
  answers     Json     // { stepId: optionId }
  resultTags  String[] // Computed tags from answers
  createdAt   DateTime @default(now())
  
  lead     Lead     @relation(fields: [leadId], references: [id])
  campaign Campaign @relation(fields: [campaignId], references: [id])
}
```

## Related Files

- `app/domains/campaigns/types/campaign.ts` (schemas)
- `app/domains/storefront/popups-new/QuizPopup.tsx` (new)
- `app/domains/campaigns/components/content-sections/QuizContent.tsx` (new)
- `app/domains/campaigns/components/quiz-builder/` (new directory)

## Success Metrics

- Quiz completion rate
- Lead capture rate from quizzes
- Product recommendation click-through rate
- Quiz-attributed revenue

