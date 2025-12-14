# AI-Powered Copy Generation

> Priority: P2 | Impact: 🔥🔥 | Effort: Medium

## Summary

Use AI to auto-generate headlines, CTAs, and descriptions. Reduces setup time and improves quality for non-expert merchants.

## Why

Many merchants struggle with copywriting. AI can suggest high-converting copy based on best practices and store context.

## User Stories

- As a merchant, I want AI to suggest popup headlines
- As a merchant, I want AI to optimize my CTAs for conversion
- As a merchant, I want copy suggestions based on my store/products

## Implementation Tasks

### Headline Generation
- [ ] "Generate headline" button in content editor
- [ ] Input: template type, goal, product context
- [ ] Output: 3-5 headline suggestions
- [ ] One-click to apply suggestion

### CTA Optimization
- [ ] Suggest button text based on goal
- [ ] A/B test suggestions ("Get 10% Off" vs "Claim Your Discount")

### Full Content Generation
- [ ] Generate all content fields at once
- [ ] Based on: template, goal, store name, products
- [ ] Editable after generation

### Timing Suggestions
- [ ] Suggest optimal trigger timing from historical data
- [ ] "Show after 5 seconds (your best performing delay)"

### Template Recommendations
- [ ] Suggest template based on merchant goals
- [ ] "Based on your traffic, we recommend Newsletter popup"

## Technical Design

```typescript
// AI generation request
interface GenerateContentRequest {
  templateType: TemplateType,
  goal: CampaignGoal,
  storeContext: {
    storeName: string,
    industry?: string,
    products?: { title: string, price: number }[],
  },
  fieldToGenerate: "headline" | "subheadline" | "cta" | "all",
}
```

### AI Provider Options
- OpenAI GPT-4
- Anthropic Claude
- Self-hosted LLM

## Related Files

- `app/domains/campaigns/components/form/ContentEditor.tsx`
- `app/routes/api.ai.generate.tsx` (new)
- `app/lib/ai/` (new)

