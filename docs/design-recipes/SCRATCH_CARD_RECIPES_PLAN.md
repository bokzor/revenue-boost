# Scratch Card Popup Design Recipes - Planning Document

## Overview

This document outlines 8 scratch card popup design recipes covering different industries, styles, and reward types. Each recipe showcases different design system capabilities.

---

## Scratch Card Design System Analysis

### Scratch Card Structure

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │     SCRATCH OVERLAY             │    │  ← scratchOverlayColor / scratchOverlayImage
│  │     (user scratches this)       │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     REVEALED PRIZE              │    │  ← Prize label + discount code
│  │     "20% OFF - CODE: LUCKY20"   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Headline: "Scratch to Reveal!"         │  ← headline
│  Subheadline: "Everyone wins!"          │  ← subheadline
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  📧 Enter your email            │    │  ← Email collection (before/after)
│  └─────────────────────────────────┘    │
│                                         │
│  [ Claim My Prize ]                     │  ← buttonText
│                                         │
└─────────────────────────────────────────┘
```

### Content Schema Fields

| Field | Type | Description | Design Impact |
|-------|------|-------------|---------------|
| `headline` | string | Main title | Typography showcase |
| `subheadline` | string | Supporting text | Tone setting |
| `buttonText` | string | CTA button | Action language |
| `scratchInstruction` | string | "Scratch to reveal" | UX guidance |
| `emailBeforeScratching` | boolean | Collect email first? | Flow variation |
| `scratchThreshold` | number (0-100) | % to scratch to reveal | Difficulty |
| `scratchRadius` | number (5-100) | Brush size in px | UX feel |
| `prizes` | array | Prize definitions | Reward structure |

### Design Config Fields

| Field | Type | Description | Variation Potential |
|-------|------|-------------|---------------------|
| `backgroundColor` | string | Popup background | Solid vs Gradient |
| `textColor` | string | Main text color | Light vs Dark themes |
| `buttonColor` | string | CTA button color | Brand accent |
| `scratchCardBackgroundColor` | string | Card surface color | Revealed area |
| `scratchOverlayColor` | string | Scratch layer color | Gold, silver, neon, etc. |
| `scratchOverlayImage` | string | Pattern/texture URL | Custom scratch textures |
| `borderRadius` | number | Corner rounding | Sharp vs Rounded |
| `inputBorderRadius` | number | Input field corners | Consistent with card |

### Overlay Texture Ideas

| Style | Image Prompt | Use Case |
|-------|--------------|----------|
| **Gold Foil** | Metallic gold texture, shiny reflective surface | Luxury, jewelry |
| **Silver Metallic** | Brushed silver metal texture | Tech, modern |
| **Holographic** | Rainbow holographic foil, iridescent | Youth, trendy |
| **Neon Grid** | Cyberpunk grid pattern, glowing lines | Gaming, tech |
| **Paper Scratch** | Lottery ticket texture, paper grain | Casual, playful |
| **Confetti Pattern** | Colorful confetti on solid background | Celebration |
| **Wood Grain** | Natural wood texture, organic feel | Organic, artisan |
| **Marble** | Elegant marble pattern | Luxury, beauty |

---

## Layout Strategy

### Scratch Card Popup Layouts

| Layout | Description | Best For |
|--------|-------------|----------|
| **centered** | Card centered, minimal distractions | All industries |
| **split-left** | Card on left, content on right | Fashion, beauty |
| **split-right** | Content on left, card on right | Tech, gaming |
| **full-background** | Background image with card overlay | Seasonal, event |

### Key Principles

1. **Scratch area should be prominent** — Main interaction focus
2. **Clear scratch instruction** — User knows what to do
3. **Instant gratification** — Reveal feels rewarding
4. **Prize visibility** — Revealed prize is clear and exciting
5. **Email timing matters** — Before (builds anticipation) vs After (captures winners)

---

## Recipe Categories

| Category | Recipes | Target Audience |
|----------|---------|-----------------|
| **Luxury & Premium** | Golden Reveal, Marble Elegance | High-end retail, jewelry |
| **Tech & Gaming** | Neon Arcade, Cyber Scratch | Gaming, electronics |
| **Natural & Organic** | Paper Luck, Wood Artisan | Food, eco-friendly |
| **Beauty & Lifestyle** | Rose Gold Dream, Shimmer | Cosmetics, fashion |

---

## Recipe Template

```yaml
Recipe:
  name: "Recipe Name"
  industry: "Target Industry"
  style: "Visual Style"
  layout: "centered | split-left | split-right | full-background"

  scratchOverlay:
    description: "AI prompt for scratch texture"
    format: "png (with transparency) or jpg"
    dimensions: "400x200 or 500x250"
    style: "Metallic | Paper | Holographic | Pattern"

  colors:
    background: "#FFFFFF"
    text: "#1A1A1A"
    description: "#6B7280"
    button: "#3B82F6"
    buttonText: "#FFFFFF"
    scratchCardBackground: "#F9FAFB"  # Revealed area
    scratchOverlay: "#FFD700"         # Scratch surface color

  scratchSettings:
    threshold: 50        # % to scratch (30-70 typical)
    brushRadius: 25      # px (15-40 typical)

  content:
    headline: "Scratch to Reveal!"
    subheadline: "Everyone wins something special"
    scratchInstruction: "Use your finger or mouse to scratch"
    buttonText: "Claim My Prize"

  prizes:
    - label: "10% OFF"
      probability: 0.50
    - label: "15% OFF"


---

## Recipes

### 1. Golden Reveal (Luxury Fashion)

```yaml
name: "Golden Reveal"
industry: "Luxury Fashion, Jewelry, High-end Retail"
style: "Elegant"
layout: "centered"

scratchOverlay:
  prompt: "Luxurious gold foil texture, metallic shine with subtle scratches,
    reflective surface catching light, premium and expensive feel,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Metallic Gold Foil"
  path: "public/recipes/scratch-card/golden-reveal-overlay.png"

backgroundImage:
  prompt: "Abstract gold and cream luxury pattern, subtle geometric shapes,
    soft golden gradient with marble accents, premium aesthetic,
    negative space in center for card placement, 4:3 aspect ratio"
  format: "jpg"
  dimensions: "1600x1200"
  ratio: "4:3"
  style: "Abstract Luxury"
  path: "public/recipes/scratch-card/golden-reveal-bg.jpg"

colors:
  background: "#1A1814"
  text: "#F5F0E8"
  description: "#C9B99A"
  accent: "#D4AF37"
  button: "#D4AF37"
  buttonText: "#1A1814"
  scratchCardBackground: "#F5F0E8"
  scratchOverlay: "#D4AF37"
  inputBackground: "rgba(255,255,255,0.1)"
  inputBorder: "#D4AF37"

typography:
  fontFamily: "'Playfair Display', Georgia, serif"
  headlineSize: "1.875rem"
  headlineWeight: "500"

scratchSettings:
  threshold: 40           # Easy to reveal (luxury = instant gratification)
  brushRadius: 30         # Large brush for smooth experience

content:
  headline: "Reveal Your Exclusive Reward"
  subheadline: "A special gift awaits our valued guests"
  scratchInstruction: "Gently scratch to unveil your reward"
  buttonText: "Claim Now"
  successMessage: "Congratulations on your exclusive reward"

prizes:
  - label: "15% OFF"
    probability: 0.45
  - label: "20% OFF"
    probability: 0.30
  - label: "Free Luxury Gift"
    probability: 0.15
  - label: "25% OFF"
    probability: 0.10

emailCollection:
  mode: "after"           # Reveal first, then capture
  required: true

leadCapture:
  nameField: true         # VIP personalization
  consentField: true      # Luxury brands = GDPR compliance

designVariations:
  borderRadius: 16        # Elegant rounded
  buttonBorderRadius: 8
  inputBorderRadius: 8
  contentSpacing: "comfortable"
  textAlign: "center"
```

---

### 2. Neon Arcade (Gaming/Tech)

```yaml
name: "Neon Arcade"
industry: "Gaming, Tech, Electronics"
style: "Bold/Cyber"
layout: "centered"

scratchOverlay:
  prompt: "Cyberpunk neon grid pattern, glowing magenta and cyan lines on dark purple background,
    pixel-art inspired texture, retro-futuristic gaming aesthetic,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Neon Grid"
  path: "public/recipes/scratch-card/neon-arcade-overlay.png"

backgroundImage: null  # Uses CSS gradient background instead

colors:
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)"
  text: "#FFFFFF"
  description: "#A78BFA"
  accent: "#EC4899"
  button: "#EC4899"
  buttonText: "#FFFFFF"
  scratchCardBackground: "#1A1625"
  scratchOverlay: "#00FFFF"
  inputBackground: "rgba(167, 139, 250, 0.2)"
  inputBorder: "#A78BFA"

typography:
  fontFamily: "'Press Start 2P', 'Courier New', monospace"  # Pixel font
  headlineSize: "1.5rem"
  headlineWeight: "400"

scratchSettings:
  threshold: 60           # Slightly harder (gamers like challenge)
  brushRadius: 20         # Smaller for precision

content:
  headline: "SCRATCH TO WIN"
  subheadline: "Unlock your player reward"
  scratchInstruction: "Scratch the card, claim your loot!"
  buttonText: "CLAIM LOOT"
  successMessage: "ACHIEVEMENT UNLOCKED! 🎮"

prizes:
  - label: "10% OFF"
    probability: 0.40
  - label: "15% OFF"
    probability: 0.30
  - label: "Free Accessory"
    probability: 0.20
  - label: "25% OFF"
    probability: 0.10

emailCollection:
  mode: "before"          # Gate the game
  required: true

leadCapture:
  nameField: false        # Quick, frictionless
  consentField: false

designVariations:
  borderRadius: 8         # Sharp-ish cyber feel
  buttonBorderRadius: 4
  inputBorderRadius: 4
  contentSpacing: "compact"
  textAlign: "center"
  buttonBoxShadow: "0 0 20px rgba(236, 72, 153, 0.5)"  # Neon glow
```

---

### 3. Paper Luck (Casual/Food)

```yaml
name: "Paper Luck"
industry: "Food & Beverage, Casual Dining, Grocery"
style: "Playful"
layout: "centered"

scratchOverlay:
  prompt: "Classic lottery ticket scratch-off texture, silver-grey metallic coating,
    paper grain visible underneath, authentic scratch-off feel,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Lottery Ticket"
  path: "public/recipes/scratch-card/paper-luck-overlay.png"

backgroundImage: null  # Uses solid color background

colors:
  background: "#FEF9C3"  # Cheerful yellow
  text: "#1F2937"
  description: "#4B5563"
  accent: "#EF4444"
  button: "#EF4444"
  buttonText: "#FFFFFF"
  scratchCardBackground: "#FFFFFF"
  scratchOverlay: "#9CA3AF"  # Silver grey
  inputBackground: "#FFFFFF"
  inputBorder: "#E5E7EB"

typography:
  fontFamily: "'Comic Neue', 'Comic Sans MS', cursive"
  headlineSize: "2rem"
  headlineWeight: "700"

scratchSettings:
  threshold: 50
  brushRadius: 25

content:
  headline: "Try Your Luck! 🍀"
  subheadline: "Every scratch is a winner!"
  scratchInstruction: "Scratch here to reveal your treat"
  buttonText: "Yum! Claim It"
  successMessage: "Delicious! Enjoy your reward 🎉"

prizes:
  - label: "Free Cookie"
    probability: 0.40
  - label: "10% OFF"
    probability: 0.30
  - label: "Free Drink"
    probability: 0.20
  - label: "15% OFF"
    probability: 0.10

emailCollection:
  mode: "after"
  required: true

leadCapture:
  nameField: false
  consentField: false

designVariations:
  borderRadius: 12
  buttonBorderRadius: 999  # Pill button
  inputBorderRadius: 8
  contentSpacing: "comfortable"
  textAlign: "center"
```

### 4. Rose Gold Dream (Beauty)

```yaml
name: "Rose Gold Dream"
industry: "Beauty, Skincare, Cosmetics"
style: "Feminine/Elegant"
layout: "centered"

scratchOverlay:
  prompt: "Rose gold metallic shimmer texture, soft pink undertones,
    luxury cosmetic packaging feel, gentle sparkle effect,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Rose Gold Shimmer"
  path: "public/recipes/scratch-card/rose-gold-overlay.png"

backgroundImage:
  prompt: "Soft blush pink abstract watercolor, gentle gradients,
    subtle floral accents, dreamy feminine aesthetic,
    negative space in center for card placement, 4:3 aspect ratio"
  format: "jpg"
  dimensions: "1600x1200"
  ratio: "4:3"
  style: "Watercolor Abstract"
  path: "public/recipes/scratch-card/rose-gold-bg.jpg"

colors:
  background: "#FDF2F8"
  text: "#831843"
  description: "#9D174D"
  accent: "#F472B6"
  button: "#DB2777"
  buttonText: "#FFFFFF"
  scratchCardBackground: "#FFFFFF"
  scratchOverlay: "#F9A8D4"
  inputBackground: "#FFFFFF"
  inputBorder: "#FBCFE8"

typography:
  fontFamily: "'Cormorant Garamond', Georgia, serif"
  headlineSize: "1.875rem"
  headlineWeight: "500"

scratchSettings:
  threshold: 45
  brushRadius: 28

content:
  headline: "Reveal Your Beauty Gift"
  subheadline: "Something special just for you ✨"
  scratchInstruction: "Scratch gently to reveal your reward"
  buttonText: "Claim My Gift"
  successMessage: "You're glowing! Enjoy your reward 💖"

prizes:
  - label: "10% OFF"
    probability: 0.40
  - label: "Free Sample Set"
    probability: 0.30
  - label: "15% OFF"
    probability: 0.20
  - label: "Free Full-Size Product"
    probability: 0.10

emailCollection:
  mode: "after"
  required: true

leadCapture:
  nameField: true         # Personalized beauty recommendations
  consentField: true      # Beauty brand = marketing consent

designVariations:
  borderRadius: 20        # Very rounded, soft
  buttonBorderRadius: 999 # Pill button
  inputBorderRadius: 12
  contentSpacing: "comfortable"
  textAlign: "center"
```

---

### 5. Minimal Silver (Tech/Modern)

```yaml
name: "Minimal Silver"
industry: "SaaS, Electronics, Modern Retail"
style: "Minimal"
layout: "centered"

scratchOverlay:
  prompt: "Clean brushed aluminum texture, subtle horizontal lines,
    Apple-inspired metallic finish, modern and premium silver-grey,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Brushed Aluminum"
  path: "public/recipes/scratch-card/minimal-silver-overlay.png"

backgroundImage: null  # Uses solid white background

colors:
  background: "#FFFFFF"
  text: "#111827"
  description: "#6B7280"
  accent: "#3B82F6"
  button: "#111827"
  buttonText: "#FFFFFF"
  scratchCardBackground: "#F9FAFB"
  scratchOverlay: "#9CA3AF"
  inputBackground: "#F9FAFB"
  inputBorder: "#E5E7EB"

typography:
  fontFamily: "'Inter', system-ui, sans-serif"
  headlineSize: "1.5rem"
  headlineWeight: "600"

scratchSettings:
  threshold: 50
  brushRadius: 22

content:
  headline: "Scratch to Unlock"
  subheadline: "Your exclusive discount awaits"
  scratchInstruction: "Scratch the card to reveal"
  buttonText: "Apply Discount"
  successMessage: "Discount unlocked!"

prizes:
  - label: "5% OFF"
    probability: 0.35
  - label: "10% OFF"
    probability: 0.35
  - label: "15% OFF"
    probability: 0.20
  - label: "20% OFF"
    probability: 0.10

emailCollection:
  mode: "before"
  required: true

leadCapture:
  nameField: false
  consentField: false

designVariations:
  borderRadius: 12
  buttonBorderRadius: 8
  inputBorderRadius: 6
  contentSpacing: "compact"
  textAlign: "center"
```

---

### 6. Holiday Magic (Seasonal)

```yaml
name: "Holiday Magic"
industry: "Seasonal Campaigns, Gift Shops, Retail"
style: "Festive"
layout: "full-background"

scratchOverlay:
  prompt: "Frosted window texture with snowflakes, icy blue and white tones,
    magical winter sparkle, holiday greeting card aesthetic,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Frosted Ice"
  path: "public/recipes/scratch-card/holiday-magic-overlay.png"

backgroundImage:
  prompt: "Festive red and gold holiday pattern, subtle snowflakes,
    warm Christmas lights bokeh, cozy winter celebration mood,
    negative space in center for card placement, 3:2 aspect ratio"
  format: "jpg"
  dimensions: "1920x1280"
  ratio: "3:2"
  style: "Holiday Photography"
  path: "public/recipes/scratch-card/holiday-magic-bg.jpg"

colors:
  background: "#7F1D1D"  # Deep red
  text: "#FFFFFF"
  description: "#FDE68A"
  accent: "#FCD34D"
  button: "#FCD34D"
  buttonText: "#7F1D1D"
  scratchCardBackground: "#FEF3C7"
  scratchOverlay: "#60A5FA"  # Icy blue
  inputBackground: "rgba(255,255,255,0.9)"
  inputBorder: "#FDE68A"

typography:
  fontFamily: "'Playfair Display', Georgia, serif"
  headlineSize: "2rem"
  headlineWeight: "600"

scratchSettings:
  threshold: 40
  brushRadius: 30

content:
  headline: "Unwrap Your Holiday Surprise! 🎄"
  subheadline: "Santa brought something special"
  scratchInstruction: "Scratch to reveal your gift"
  buttonText: "Open My Gift"
  successMessage: "Happy Holidays! Enjoy your gift 🎁"

prizes:
  - label: "10% OFF"
    probability: 0.35
  - label: "15% OFF"
    probability: 0.30
  - label: "Free Gift Wrap"
    probability: 0.20
  - label: "25% OFF"
    probability: 0.10
  - label: "Free Shipping"
    probability: 0.05

emailCollection:
  mode: "after"
  required: true

leadCapture:
  nameField: false
  consentField: false

designVariations:
  borderRadius: 16
  buttonBorderRadius: 8
  inputBorderRadius: 8
  contentSpacing: "comfortable"
  textAlign: "center"
  overlayOpacity: 0.4
```

---

### 7. Wood Artisan (Organic/Craft)

```yaml
name: "Wood Artisan"
industry: "Handmade, Organic, Artisan Products"
style: "Natural"
layout: "centered"

scratchOverlay:
  prompt: "Natural light oak wood grain texture, visible grain patterns,
    handcrafted artisan feel, organic and sustainable aesthetic,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Wood Grain"
  path: "public/recipes/scratch-card/wood-artisan-overlay.png"

backgroundImage: null  # Uses solid cream color background

colors:
  background: "#FEFCE8"  # Natural cream
  text: "#422006"
  description: "#78350F"
  accent: "#92400E"
  button: "#78350F"
  buttonText: "#FFFFFF"
  scratchCardBackground: "#FEF3C7"
  scratchOverlay: "#D97706"
  inputBackground: "#FFFFFF"
  inputBorder: "#FDE68A"

typography:
  fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif"
  headlineSize: "1.75rem"
  headlineWeight: "600"

scratchSettings:
  threshold: 55
  brushRadius: 24

content:
  headline: "Scratch Your Handcrafted Reward"
  subheadline: "Made with love, just for you"
  scratchInstruction: "Scratch to reveal your artisan gift"
  buttonText: "Claim My Reward"
  successMessage: "Thank you for supporting handmade! 🌿"

prizes:
  - label: "10% OFF"
    probability: 0.40
  - label: "Free Shipping"
    probability: 0.30
  - label: "15% OFF"
    probability: 0.20
  - label: "Free Gift"
    probability: 0.10

emailCollection:
  mode: "after"
  required: true

leadCapture:
  nameField: false
  consentField: true      # Eco-conscious = transparent marketing

designVariations:
  borderRadius: 8
  buttonBorderRadius: 6
  inputBorderRadius: 6
  contentSpacing: "comfortable"
  textAlign: "center"
```

---

### 8. Holographic Hype (Youth/Trend)

```yaml
name: "Holographic Hype"
industry: "Gen-Z Fashion, Trendy Accessories, Pop Culture"
style: "Bold/Trendy"
layout: "centered"

scratchOverlay:
  prompt: "Iridescent holographic foil texture, rainbow color shift effect,
    Y2K aesthetic, trendy and eye-catching, shimmering surface,
    seamless texture, 2:1 aspect ratio landscape format, high resolution"
  format: "png"
  dimensions: "1000x500"
  ratio: "2:1"
  style: "Holographic Foil"
  path: "public/recipes/scratch-card/holographic-hype-overlay.png"

backgroundImage:
  prompt: "Abstract gradient mesh, purple to pink to blue fluid transitions,
    modern Gen-Z aesthetic, Instagram-worthy, fluid organic shapes,
    negative space in center for card placement, 4:3 aspect ratio"
  format: "jpg"
  dimensions: "1600x1200"
  ratio: "4:3"
  style: "Gradient Mesh"
  path: "public/recipes/scratch-card/holographic-hype-bg.jpg"

colors:
  background: "linear-gradient(135deg, #C084FC 0%, #EC4899 50%, #F472B6 100%)"
  text: "#FFFFFF"
  description: "#FDE68A"
  accent: "#FDE68A"
  button: "#FFFFFF"
  buttonText: "#9333EA"
  scratchCardBackground: "#1F2937"
  scratchOverlay: "iridescent"  # Custom holographic
  inputBackground: "rgba(255,255,255,0.2)"
  inputBorder: "#FFFFFF"

typography:
  fontFamily: "'Space Grotesk', 'Poppins', sans-serif"
  headlineSize: "2rem"
  headlineWeight: "700"

scratchSettings:
  threshold: 45
  brushRadius: 26

content:
  headline: "SCRATCH FOR THE TEA ☕"
  subheadline: "no cap, you're getting a deal"
  scratchInstruction: "slide to reveal your vibe"
  buttonText: "SLAY, CLAIM IT"
  successMessage: "that's fire bestie 🔥"

prizes:
  - label: "10% OFF"
    probability: 0.35
  - label: "15% OFF"
    probability: 0.30
  - label: "Mystery Gift"
    probability: 0.25
  - label: "20% OFF"
    probability: 0.10

emailCollection:
  mode: "before"
  required: true

leadCapture:
  nameField: false
  consentField: false

designVariations:
  borderRadius: 24        # Very rounded, soft
  buttonBorderRadius: 999 # Pill
  inputBorderRadius: 16
  contentSpacing: "compact"
  textAlign: "center"
  buttonBoxShadow: "0 4px 20px rgba(236, 72, 153, 0.4)"
```

---

## Image Generation Specifications

### Scratch Overlay Textures (All Recipes)

**Standard Dimensions:** `1000 × 500 px` (2x for retina)
**Aspect Ratio:** `2:1` (landscape)
**Format:** `PNG` with transparency or solid background
**File Size Target:** < 200KB

| Recipe | Texture Type | Dimensions | Ratio | Format | AI Prompt |
|--------|--------------|------------|-------|--------|-----------|
| Golden Reveal | Gold foil metallic | 1000×500 | 2:1 | PNG | "Luxurious gold foil texture, metallic shine with subtle scratches, reflective surface catching light, premium and expensive feel, seamless texture, 2:1 aspect ratio landscape" |
| Neon Arcade | Neon grid pattern | 1000×500 | 2:1 | PNG | "Cyberpunk neon grid pattern, glowing magenta and cyan lines on dark background, pixel-art inspired texture, retro-futuristic gaming aesthetic, seamless, 2:1 landscape" |
| Paper Luck | Silver lottery scratch | 1000×500 | 2:1 | PNG | "Classic lottery ticket scratch-off texture, silver-grey metallic coating, paper grain visible underneath, authentic scratch-off feel, seamless texture, 2:1 landscape" |
| Rose Gold Dream | Rose gold shimmer | 1000×500 | 2:1 | PNG | "Rose gold metallic shimmer texture, soft pink undertones, luxury cosmetic packaging feel, gentle sparkle effect, seamless, 2:1 landscape" |
| Minimal Silver | Brushed aluminum | 1000×500 | 2:1 | PNG | "Clean brushed aluminum texture, subtle horizontal lines, Apple-inspired metallic finish, modern and premium, seamless, 2:1 landscape" |
| Holiday Magic | Frosted ice | 1000×500 | 2:1 | PNG | "Frosted window texture with snowflakes, icy blue tones, magical winter sparkle, holiday greeting card aesthetic, seamless, 2:1 landscape" |
| Wood Artisan | Wood grain | 1000×500 | 2:1 | PNG | "Natural light oak wood grain texture, handcrafted feel, organic and sustainable aesthetic, visible grain patterns, seamless, 2:1 landscape" |
| Holographic Hype | Iridescent holographic | 1000×500 | 2:1 | PNG | "Iridescent holographic foil texture, rainbow color shift, Y2K aesthetic, trendy and eye-catching, shimmering surface, seamless, 2:1 landscape" |

---

### Background Images (4 Recipes Only)

| Recipe | Background Type | Dimensions | Ratio | Format | AI Prompt |
|--------|-----------------|------------|-------|--------|-----------|
| Golden Reveal | Abstract luxury gold | 1600×1200 | 4:3 | JPG | "Abstract gold and cream luxury pattern, subtle geometric shapes, soft golden gradient with marble accents, premium aesthetic, negative space in center for card placement, 4:3 aspect ratio" |
| Rose Gold Dream | Watercolor pink | 1600×1200 | 4:3 | JPG | "Soft blush pink abstract watercolor, gentle gradients, subtle floral accents, dreamy feminine aesthetic, negative space in center, 4:3 aspect ratio" |
| Holiday Magic | Festive bokeh | 1920×1280 | 3:2 | JPG | "Festive red and gold holiday pattern, subtle snowflakes, warm Christmas lights bokeh, cozy winter celebration mood, negative space in center for card, 3:2 aspect ratio" |
| Holographic Hype | Gradient mesh | 1600×1200 | 4:3 | JPG | "Abstract gradient mesh, purple to pink to blue, modern Gen-Z aesthetic, Instagram-worthy, fluid shapes, negative space in center, 4:3 aspect ratio" |

---

### Image Dimensions Summary

| Image Type | Purpose | Dimensions (2x) | Ratio | Format | Notes |
|------------|---------|-----------------|-------|--------|-------|
| **Scratch Overlay** | Covers scratch area | 1000 × 500 px | **2:1** | PNG | Seamless texture, metallic/paper feel |
| **Background (standard)** | Popup background | 1600 × 1200 px | **4:3** | JPG | Center negative space for card |
| **Background (wide)** | Full-screen popup | 1920 × 1280 px | **3:2** | JPG | More cinematic feel |
| **Background (mobile)** | Mobile optimization | 800 × 1200 px | **2:3** | JPG | Portrait for mobile |

---

### AI Image Prompt Tips

**For Scratch Overlays (2:1 ratio):**
```
"[texture description], seamless texture, 2:1 aspect ratio landscape format,
high resolution, suitable for scratch-off effect, [color tones]"
```

**For Backgrounds (4:3 ratio):**
```
"[scene/pattern description], negative space in center for card placement,
4:3 aspect ratio, [mood descriptors], soft lighting, [color palette]"
```

**General Tips:**
- Always specify aspect ratio in prompt
- Include "seamless" for scratch textures
- Add "negative space in center" for backgrounds
- Mention "2x resolution" or "retina ready"
- Specify color palette explicitly

---

## Design Variations Summary

| Recipe | Corners | Input Style | Email Flow | Lead Capture |
|--------|---------|-------------|------------|--------------|
| Golden Reveal | 16px rounded | Outlined | After | Name + Consent |
| Neon Arcade | 8px sharp | Outlined | Before | Email only |
| Paper Luck | 12px + pill btn | Outlined | After | Email only |
| Rose Gold Dream | 20px soft | Outlined | After | Name + Consent |
| Minimal Silver | 12px | Outlined | Before | Email only |
| Holiday Magic | 16px | Outlined | After | Email only |
| Wood Artisan | 8px natural | Outlined | After | Consent |
| Holographic Hype | 24px soft + pill | Filled | Before | Email only |

---

## Implementation Checklist

For each recipe:

- [ ] Generate scratch overlay texture (PNG)
- [ ] Generate background image (if needed)
- [ ] Create recipe JSON configuration
- [ ] Test scratch interaction (threshold, radius)
- [ ] Test email collection flow (before/after)
- [ ] Test prize reveal animation
- [ ] Verify discount code generation
- [ ] Test on mobile (touch scratching)
- [ ] Screenshot for documentation
- [ ] Add to recipe picker UI

