# Theme Property Usage Audit

**Last Updated:** 2024-01-XX
**Related:** `TEMPLATE_FIELD_AUDIT.md`, `CAMPAIGN_FORM_STRATEGY.md`

This document audits which `ThemeColors` properties are actually used by popup components.

## Flow

```
ThemeColors (25 props in color-presets.ts)
       ↓
themeColorsToDesignConfig() - converts to DesignConfig
       ↓
Popup Component - uses config.* properties (some ignored!)
```

---

## ThemeColors → DesignConfig Mapping

| ThemeColors Property | DesignConfig Property | Used by Newsletter? |
|---------------------|----------------------|---------------------|
| `background` | `backgroundColor` | ✅ Yes |
| `text` | `textColor` | ✅ Yes |
| `primary` | `accentColor` | ✅ Yes |
| `secondary` | `inputBackgroundColor` | ✅ Yes |
| `accent` | ❌ Not mapped | ❌ No |
| `border` | `inputBorderColor` (fallback) | ✅ Yes |
| `success` | `successColor` | ✅ Yes |
| `warning` | ❌ Not mapped | ❌ No |
| `imageBg` | `imageBgColor` | ✅ Yes |
| `descColor` | `descriptionColor` | ✅ Yes |
| `inputBorder` | `inputBorderColor` | ✅ Yes |
| `inputTextColor` | `inputTextColor` | ✅ Yes |
| `timerBg` | ❌ Not mapped | ❌ No |
| `timerText` | ❌ Not mapped | ❌ No |
| `ctaBg` | `buttonColor` | ✅ Yes |
| `ctaText` | `buttonTextColor` | ✅ Yes |
| `fontFamily` | `fontFamily` | ❌ **NOT USED** |
| `titleFontSize` | `titleFontSize` | ✅ Yes |
| `titleFontWeight` | `titleFontWeight` | ✅ Yes |
| `titleTextShadow` | `titleTextShadow` | ❌ **Defined but NOT USED** |
| `descriptionFontSize` | `descriptionFontSize` | ✅ Yes |
| `descriptionFontWeight` | `descriptionFontWeight` | ✅ Yes |
| `inputBackdropFilter` | `inputBackdropFilter` | ✅ Yes |
| `inputBoxShadow` | `inputBoxShadow` | ✅ Yes |
| `blur` | ❌ Not mapped | ❌ No |

---

## Summary

### Properties That Work ✅ (17)
- `background`, `text`, `primary`, `secondary`, `border`
- `success`, `imageBg`, `descColor`, `inputBorder`, `inputTextColor`
- `ctaBg`, `ctaText`
- `titleFontSize`, `titleFontWeight`
- `descriptionFontSize`, `descriptionFontWeight`
- `inputBackdropFilter`, `inputBoxShadow`

### Properties NOT Used ❌ (8)
| Property | Issue |
|----------|-------|
| `accent` | Not mapped to DesignConfig |
| `warning` | Not mapped to DesignConfig |
| `timerBg` | Not mapped (Newsletter doesn't have timer) |
| `timerText` | Not mapped (Newsletter doesn't have timer) |
| `fontFamily` | Mapped but popup doesn't use it |
| `titleTextShadow` | Mapped but popup doesn't use it |
| `blur` | Not mapped |

---

## Risk Assessment

### Safe to Expose in Form (actually work):
- Background color
- Text color
- Button color (ctaBg)
- Button text color
- Accent/Primary color
- Input colors (bg, border, text)
- Description color
- Typography sizes and weights
- Input effects (backdrop filter, box shadow)

### NOT Safe to Expose (won't work):
- Font family (not wired)
- Title text shadow (not wired)
- Timer colors (Newsletter doesn't have timer)
- Warning color (not used)

---

## Recommendations

1. **Only expose properties that are actually wired to components**
2. **Fix the missing wiring** for `fontFamily` and `titleTextShadow` if we want them to work
3. **Timer colors** are only relevant for templates with timers (Flash Sale, Countdown)
4. **Create template-specific theme subsets** - Newsletter doesn't need timer colors

---

## Action Items

- [ ] Wire `fontFamily` to Newsletter popup CSS
- [ ] Wire `titleTextShadow` to headline styles
- [ ] Remove unused properties from Advanced Mode
- [ ] Create separate theme property sets per template type

