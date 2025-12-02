# Campaign Form Strategy

**Last Updated:** 2024-01-XX
**Status:** Planning Phase

---

## Executive Summary

We're simplifying campaign creation by using **recipes as the primary entry point**. Users pick a recipe, customize text and theme, and launch.

---

## Where We Are Now

### ✅ Completed
1. **Recipe Picker** - Full-width with categories, hover previews
2. **Configuration Modal** - Quick inputs (discount %) before form
3. **Recipe Catalog** - 10+ styled recipes with themes and backgrounds
4. **Theme System** - 17 newsletter themes, 8 flash sale themes defined

### ⚠️ In Progress
1. **Form simplification** - Deciding what fields to expose
2. **Recipe → Form data flow** - Partially working via sessionStorage

### ❌ Known Issues
1. **Form/Popup mismatch** - ~76 fields across templates not properly wired
2. **Theme properties not wired** - 8 of 25 theme properties don't work
3. **Complex form** - Too many fields, overwhelming UX

---

## What We've Learned (Audits)

### 1. Template Field Audit (`TEMPLATE_FIELD_AUDIT.md`)
- **76 field mismatches** across 11 templates
- Newsletter has 22 missing fields (worst)
- Some templates are clean (Scratch Card, Free Shipping)

### 2. Theme Property Audit (`THEME_PROPERTY_AUDIT.md`)
- **17 of 25 theme properties work** in Newsletter
- `fontFamily` and `titleTextShadow` are defined but not wired
- Timer colors only relevant for timer-based templates

---

## The Decision: Simplified Form

### What Users See

```
┌─────────────────────────────────────────────────────────────┐
│ Content                                                     │
│   • Headline                                                │
│   • Subheadline                                             │
│   • Button text                                             │
│   • Email placeholder                                       │
├─────────────────────────────────────────────────────────────┤
│ Theme                                                       │
│   • Theme picker (presets from recipe)                      │
│   • [Optional] Brand/Background/Text color overrides        │
├─────────────────────────────────────────────────────────────┤
│ Layout                                                      │
│   • Image position (left/right/full/none)                   │
│   • Background image picker                                 │
├─────────────────────────────────────────────────────────────┤
│ Discount                                                    │
│   • Enable toggle + percentage                              │
└─────────────────────────────────────────────────────────────┘
```

### What Recipes Provide (Hidden from User)
- All typography (font sizes, weights)
- All advanced colors (input borders, timer colors, etc.)
- Effects (shadows, backdrop filters)
- Most design decisions

---

## Priority Order

### P0 - Must Have (This Sprint)
1. **Simplify NewsletterContentSection** - Remove unused fields
2. **Wire recipe data to form** - Ensure presets flow through
3. **Theme picker component** - Use existing themes
4. **Test Newsletter end-to-end** - Recipe → Form → Preview → Save

### P1 - Should Have (Next Sprint)
1. **Fix broken theme properties** - `fontFamily`, `titleTextShadow`
2. **Image position picker** - Visual layout selector
3. **Background image picker** - Preset + upload options
4. **3-color override** - Brand/Background/Text

### P2 - Nice to Have (Later)
1. **Advanced Mode** - Expose more theme properties
2. **Other templates** - Apply same simplification pattern
3. **Full audit fixes** - Wire all 76 missing fields

### P3 - Future
1. **Block-based architecture** - If we need more flexibility
2. **Custom theme creator** - Full theme editor

---

## Next Actions

### Completed ✅
1. [x] Created shared `LeadCaptureConfig` interface as single source of truth
2. [x] Updated Zod schema to use shared interface
3. [x] Renamed `FieldConfigurationSection` → `LeadCaptureFormSection`
4. [x] Added missing `nameFieldLabel` field to form
5. [x] Created `mapLeadCaptureConfigToFormProps()` helper
6. [x] Created sync test to catch future drift
7. [x] Simplified `NewsletterContentSection.tsx` to essential fields only
   - Removed: emailLabel, dismissLabel, emailPlaceholder, failureMessage (duplicates or unused)
   - Kept: headline, subheadline, buttonText, successMessage
   - Lead capture details handled by `LeadCaptureFormSection`

### Immediate (Today)
1. [x] Simplify `NewsletterContentSection.tsx` to essential fields only
2. [ ] Create `ThemePicker` component using `NEWSLETTER_THEMES`
3. [ ] Test recipe → form flow end-to-end

### This Week
1. [ ] Wire remaining essential fields
2. [ ] Add image position picker
3. [ ] Add background picker

---

## Documents Reference

| Document | Purpose |
|----------|---------|
| `RECIPE_UX_STRATEGY.md` | UX flow and user experience |
| `FORM_ARCHITECTURE_ANALYSIS.md` | Form architecture problems |
| `TEMPLATE_FIELD_AUDIT.md` | Field-by-field mismatch audit |
| `THEME_PROPERTY_AUDIT.md` | Theme property usage audit |
| `CAMPAIGN_FORM_STRATEGY.md` | This doc - overall strategy |

---

## Success Criteria

1. **User can create a campaign in < 2 minutes**
2. **Form shows only fields that actually work**
3. **Preview updates in real-time**
4. **Recipes provide sensible defaults**

