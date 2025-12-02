# Newsletter Popup Design Recipes - Planning Document

## Overview

This document outlines 12 newsletter popup design recipes covering different industries, styles, and use cases. Each recipe is a complete, ready-to-use configuration.

---

## Background Strategy

### Rules for Background + Image Combinations

| Layout | Background | Image | Overlay | Notes |
|--------|-----------|-------|---------|-------|
| **minimal** | Solid or Gradient | None | N/A | Gradient backgrounds work great here |
| **split-left/right** | Solid | Yes | N/A | Image fills one column, bg fills other |
| **hero** | Solid | Yes | N/A | Image as banner, bg for content area |
| **full-background** | Solid | Yes | 0.3-0.7 | Overlay tints image with bg color |

### Key Principles

1. **Never combine gradient background + image** — Redundant and visually confusing
2. **Gradient backgrounds = minimal layout only** — Let the gradient shine without competing elements
3. **Full-background + image = use overlay** — The `overlayOpacity` lets the background color tint the image
4. **Overlay opacity 0.3-0.5** — Light tint, image still visible
5. **Overlay opacity 0.5-0.7** — Stronger tint, more emphasis on text

### Examples

```yaml
# ✅ Good: Gradient background, no image (minimal)
layout: "minimal"
background: "linear-gradient(135deg, #1a1a2e, #0f0f23)"
image: null

# ✅ Good: Solid background, image in split layout
layout: "split-left"
background: "#FAF9F7"
image: "fashion-editorial.jpg"

# ✅ Good: Solid background, image with overlay (full-background)
layout: "full-background"
background: "#F5F7F4"
image: "spa-zen.jpg"
overlayOpacity: 0.3

# ❌ Bad: Gradient background + image
layout: "full-background"
background: "linear-gradient(...)"  # Don't do this
image: "some-image.jpg"             # with an image
```

---

## Recipe Categories

| Category | Recipes | Target Audience |
|----------|---------|-----------------|
| **Fashion & Lifestyle** | Elegant Luxe, Street Style | High-end retail, streetwear |
| **Tech & SaaS** | Minimal Tech, Dark Mode | Software, electronics |
| **Food & Beverage** | Fresh & Organic, Cafe Warm | Restaurants, grocery, coffee |
| **Beauty & Wellness** | Soft Glow, Spa Serenity | Cosmetics, skincare, wellness |
| **Home & Living** | Scandinavian, Cozy Comfort | Furniture, decor, lifestyle |
| **Fitness & Sports** | Bold Energy, Active Life | Gyms, sportswear, supplements |

---

## Recipe Template

```yaml
Recipe:
  name: "Recipe Name"
  industry: "Target Industry"
  style: "Visual Style (Minimal/Bold/Elegant/Playful/Modern)"
  layout: "split-left | split-right | hero | minimal | full-background"
  
  image:
    description: "AI prompt for image generation"
    format: "jpg"
    dimensions: "800x1000 (portrait for split) | 1200x400 (landscape for hero)"
    style: "Photography | Illustration | Abstract"
    
  colors:
    background: "#FFFFFF"
    text: "#1A1A1A"
    description: "#6B7280"
    accent: "#3B82F6"
    button: "#3B82F6"
    buttonText: "#FFFFFF"
    inputBackground: "#F9FAFB"
    inputBorder: "#E5E7EB"
    
  typography:
    fontFamily: "Inter, system-ui, sans-serif"
    headlineSize: "1.75rem"
    headlineWeight: "700"
    descriptionSize: "1rem"
    
  content:
    headline: "Main headline text"
    subheadline: "Supporting description text"
    emailPlaceholder: "Enter your email"
    buttonText: "Subscribe"
    secondaryButtonText: "No thanks"
    successMessage: "Welcome! Check your inbox."
    
  incentive:
    type: "percentage | fixed | freeShipping | freeGift | earlyAccess | none"
    value: "10%"
    code: "WELCOME10"
    
  triggers:
    delay: 5000
    scrollPercent: null
    exitIntent: false
    
  targeting:
    devices: ["desktop", "mobile", "tablet"]
    pages: ["all"]
    newVisitorsOnly: true
```

---

## Recipes

### 1. Elegant Luxe (Fashion)

```yaml
name: "Elegant Luxe"
industry: "High-end Fashion & Luxury Retail"
style: "Elegant"
layout: "split-left"

image:
  description: "Elegant fashion editorial photo, model in minimalist luxury clothing,
    soft natural lighting, neutral beige/cream tones, high-end magazine aesthetic,
    negative space on right side for text overlay"
  format: "jpg"
  dimensions: "800x1000"
  style: "Editorial Photography"
  path: "public/recipes/newsletter/elegant-luxe.jpg"
colors:
  background: "#FAF9F7"
  text: "#1A1A1A"
  description: "#6B6B6B"
  accent: "#C9A962"
  button: "#1A1A1A"
  buttonText: "#FFFFFF"
  inputBackground: "#FFFFFF"
  inputBorder: "#E8E6E3"

typography:
  fontFamily: "'Playfair Display', Georgia, serif"
  headlineSize: "2rem"
  headlineWeight: "500"
  descriptionSize: "0.95rem"

content:
  headline: "Join the Inner Circle"
  subheadline: "Be the first to discover new collections and receive exclusive offers."
  emailPlaceholder: "Your email address"
  buttonText: "Subscribe"
  secondaryButtonText: "Maybe later"
  successMessage: "Welcome to the family."

incentive:
  type: "percentage"
  value: "15%"
  code: "LUXE15"

triggers:
  delay: 8000
  exitIntent: true
```

---

### 2. Street Style (Fashion)

```yaml
name: "Street Style"
industry: "Streetwear & Urban Fashion"
style: "Bold"
layout: "split-right"

image:
  description: "Urban streetwear photography, concrete textures, bold typography
    graffiti elements, high contrast, dynamic angle, young and edgy aesthetic"
  format: "jpg"
  dimensions: "800x1000"
  style: "Street Photography"
  path: "public/recipes/newsletter/street-style.jpg"
colors:
  background: "#0A0A0A"
  text: "#FFFFFF"
  description: "#A1A1A1"
  accent: "#FF3366"
  button: "#FF3366"
  buttonText: "#FFFFFF"
  inputBackground: "#1A1A1A"
  inputBorder: "#333333"

typography:
  fontFamily: "'Space Grotesk', 'Arial Black', sans-serif"
  headlineSize: "2.25rem"
  headlineWeight: "700"
  descriptionSize: "1rem"

content:
  headline: "DROP ALERTS"
  subheadline: "Never miss a release. Get exclusive early access to limited drops."
  emailPlaceholder: "Enter email"
  buttonText: "GET ACCESS"
  secondaryButtonText: "Not now"
  successMessage: "You're in. 🔥"

incentive:
  type: "earlyAccess"
  value: "24h early access"
  code: null

triggers:
  delay: 5000
  scrollPercent: 25
```

---

### 3. Minimal Tech (SaaS/Tech)

```yaml
name: "Minimal Tech"
industry: "SaaS & Technology"
style: "Minimal"
layout: "minimal"

image:
  description: null  # No image - minimal design
  format: null
  dimensions: null
  style: null

colors:
  background: "#FFFFFF"
  text: "#111827"
  description: "#6B7280"
  accent: "#6366F1"
  button: "#111827"
  buttonText: "#FFFFFF"
  inputBackground: "#F9FAFB"
  inputBorder: "#E5E7EB"

typography:
  fontFamily: "'Inter', system-ui, sans-serif"
  headlineSize: "1.5rem"
  headlineWeight: "600"
  descriptionSize: "0.9375rem"

content:
  headline: "Stay in the loop"
  subheadline: "Weekly insights on product, design, and engineering."
  emailPlaceholder: "you@company.com"
  buttonText: "Subscribe"
  secondaryButtonText: "No thanks"
  successMessage: "You're subscribed!"

incentive:
  type: "none"
  value: null
  code: null

triggers:
  delay: 10000
  scrollPercent: 50
```

---

### 4. Dark Mode (Tech/Gaming)

```yaml
name: "Dark Mode"
industry: "Tech, Gaming, Developer Tools"
style: "Modern"
layout: "minimal"  # No image - uses gradient background

image: null  # No image - gradient background only

colors:
  # Gradient background (no image, so gradient is visible)
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)"
  text: "#FFFFFF"
  description: "#A1A1AA"
  accent: "#8B5CF6"
  button: "#8B5CF6"
  buttonText: "#FFFFFF"
  inputBackground: "rgba(255,255,255,0.1)"
  inputBorder: "rgba(255,255,255,0.2)"

typography:
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
  headlineSize: "1.75rem"
  headlineWeight: "600"
  descriptionSize: "0.9375rem"

content:
  headline: "Join the Beta"
  subheadline: "Get early access to new features and shape the roadmap."
  emailPlaceholder: "dev@example.com"
  buttonText: "Request Access"
  secondaryButtonText: "Learn more first"
  successMessage: "Check your inbox for next steps."

incentive:
  type: "earlyAccess"
  value: "Beta access"
  code: null

triggers:
  delay: 5000
  exitIntent: true
```

---

### 5. Fresh & Organic (Food)

```yaml
name: "Fresh & Organic"
industry: "Organic Food, Grocery, Health Food"
style: "Natural"
layout: "split-left"

image:
  description: "Fresh organic vegetables and herbs on rustic wooden surface,
    natural lighting, farm-to-table aesthetic, green and earth tones,
    overhead shot with negative space"
  format: "jpg"
  dimensions: "800x1000"
  style: "Food Photography"
  path: "public/recipes/newsletter/fresh-organic.jpg"
colors:
  background: "#FDFCFA"
  text: "#2D3319"
  description: "#5C6442"
  accent: "#7C9A3E"
  button: "#7C9A3E"
  buttonText: "#FFFFFF"
  inputBackground: "#FFFFFF"
  inputBorder: "#E2E5D8"

typography:
  fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif"
  headlineSize: "1.75rem"
  headlineWeight: "600"
  descriptionSize: "1rem"

content:
  headline: "Farm Fresh Updates"
  subheadline: "Seasonal recipes, nutrition tips, and exclusive member discounts."
  emailPlaceholder: "Your email"
  buttonText: "Join the Community"
  secondaryButtonText: "Not right now"
  successMessage: "Welcome! Your first recipe is on its way."

incentive:
  type: "freeShipping"
  value: "Free shipping on first order"
  code: "FRESHSTART"

triggers:
  delay: 6000
  scrollPercent: 30
```

---

### 6. Cafe Warm (Coffee/Bakery)

```yaml
name: "Cafe Warm"
industry: "Coffee Shops, Bakeries, Cafes"
style: "Warm"
layout: "hero"

image:
  description: "Artisan coffee cup with latte art on marble counter,
    warm morning light, cozy cafe atmosphere, shallow depth of field,
    warm brown and cream tones"
  format: "jpg"
  dimensions: "1200x400"
  style: "Lifestyle Photography"
  path: "public/recipes/newsletter/cofe-warm.jpg"

colors:
  background: "#FDF8F3"
  text: "#3D2314"
  description: "#7D5A43"
  accent: "#C4956A"
  button: "#3D2314"
  buttonText: "#FFFFFF"
  inputBackground: "#FFFFFF"
  inputBorder: "#E8DDD4"

typography:
  fontFamily: "'Libre Baskerville', Georgia, serif"
  headlineSize: "1.875rem"
  headlineWeight: "600"
  descriptionSize: "1rem"

content:
  headline: "Start Your Morning Right"
  subheadline: "Weekly brewing tips, new menu items, and loyalty rewards."
  emailPlaceholder: "Enter your email"
  buttonText: "Sign Up"
  secondaryButtonText: "Maybe later"
  successMessage: "Welcome! Enjoy a free pastry on us."

incentive:
  type: "freeGift"
  value: "Free pastry with first order"
  code: "FREEPASTRY"

triggers:
  delay: 5000
  scrollPercent: null
```

---

### 7. Soft Glow (Beauty)

```yaml
name: "Soft Glow"
industry: "Beauty, Skincare, Cosmetics"
style: "Elegant"
layout: "split-right"

image:
  description: "Luxury skincare product bottles on soft pink marble surface,
    delicate flowers, soft diffused lighting, clean minimalist beauty aesthetic,
    pastel pink and white tones"
  format: "jpg"
  dimensions: "800x1000"
  style: "Product Photography"
  path: "public/recipes/newsletter/soft-glow.jpg"
colors:
  background: "#FFF9F9"
  text: "#2D2D2D"
  description: "#6B6B6B"
  accent: "#E8B4BC"
  button: "#D4919A"
  buttonText: "#FFFFFF"
  inputBackground: "#FFFFFF"
  inputBorder: "#F0E4E6"

typography:
  fontFamily: "'Cormorant Garamond', Georgia, serif"
  headlineSize: "2rem"
  headlineWeight: "500"
  descriptionSize: "1rem"

content:
  headline: "Unlock Your Glow"
  subheadline: "Beauty tips, exclusive launches, and member-only offers."
  emailPlaceholder: "Enter your email"
  buttonText: "Join Now"
  secondaryButtonText: "No thanks"
  successMessage: "Welcome, gorgeous! Check your inbox."

incentive:
  type: "percentage"
  value: "20%"
  code: "GLOW20"

triggers:
  delay: 7000
  scrollPercent: 40
```

---

### 8. Spa Serenity (Wellness)

```yaml
name: "Spa Serenity"
industry: "Spa, Wellness, Meditation"
style: "Calm"
layout: "full-background"

image:
  description: "Zen spa setting with smooth stones, bamboo, soft water ripples,
    eucalyptus leaves, muted sage green and beige tones, peaceful and calming"
  format: "jpg"
  dimensions: "1200x800"
  style: "Lifestyle Photography"
  path: "public/recipes/newsletter/spa-serenity.jpg"
colors:
  background: "#F5F7F4"
  text: "#2F3E36"
  description: "#5A6B5D"
  accent: "#8BA888"
  button: "#5A6B5D"
  buttonText: "#FFFFFF"
  inputBackground: "rgba(255,255,255,0.8)"
  inputBorder: "#D4DED6"
  overlayOpacity: 0.3

typography:
  fontFamily: "'Lora', Georgia, serif"
  headlineSize: "1.875rem"
  headlineWeight: "400"
  descriptionSize: "1rem"

content:
  headline: "Find Your Balance"
  subheadline: "Wellness tips, self-care rituals, and exclusive retreat offers."
  emailPlaceholder: "Your email"
  buttonText: "Subscribe"
  secondaryButtonText: "Not today"
  successMessage: "Namaste. Welcome to your journey."

incentive:
  type: "fixed"
  value: "$25 off"
  code: "WELLNESS25"

triggers:
  delay: 8000
  exitIntent: true
```

---

### 9. Scandinavian (Home & Living)

```yaml
name: "Scandinavian"
industry: "Furniture, Home Decor, Interior Design"
style: "Minimal"
layout: "split-left"

image:
  description: "Minimalist Scandinavian living room, light wood furniture,
    white walls, single green plant, natural light from large window,
    clean lines, hygge aesthetic"
  format: "jpg"
  dimensions: "800x1000"
  style: "Interior Photography"

colors:
  background: "#FFFFFF"
  text: "#1A1A1A"
  description: "#717171"
  accent: "#D4A574"
  button: "#1A1A1A"
  buttonText: "#FFFFFF"
  inputBackground: "#F7F7F7"
  inputBorder: "#E5E5E5"

typography:
  fontFamily: "'Nunito Sans', 'Helvetica Neue', sans-serif"
  headlineSize: "1.75rem"
  headlineWeight: "600"
  descriptionSize: "0.9375rem"

content:
  headline: "Design for Living"
  subheadline: "Curated inspiration and exclusive access to new collections."
  emailPlaceholder: "Enter your email"
  buttonText: "Join Us"
  secondaryButtonText: "Not now"
  successMessage: "Welcome home."

incentive:
  type: "percentage"
  value: "10%"
  code: "HOME10"

triggers:
  delay: 6000
  scrollPercent: 35
```

---

### 10. Cozy Comfort (Home/Lifestyle)

```yaml
name: "Cozy Comfort"
industry: "Bedding, Textiles, Lifestyle"
style: "Warm"
layout: "hero"

image:
  description: "Cozy bedroom scene with soft linen bedding, knit throw blanket,
    warm morning light through curtains, neutral cream and beige tones,
    inviting and comfortable"
  format: "jpg"
  dimensions: "1200x400"
  style: "Lifestyle Photography"
  path: "public/recipes/newsletter/cozy-conformt.jpg"

colors:
  background: "#F9F6F2"
  text: "#3D3630"
  description: "#7D756C"
  accent: "#C4B5A3"
  button: "#3D3630"
  buttonText: "#FFFFFF"
  inputBackground: "#FFFFFF"
  inputBorder: "#E8E2DB"

typography:
  fontFamily: "'Source Serif Pro', Georgia, serif"
  headlineSize: "1.875rem"
  headlineWeight: "600"
  descriptionSize: "1rem"

content:
  headline: "Sleep Better, Live Better"
  subheadline: "Home styling tips and early access to seasonal sales."
  emailPlaceholder: "Your email address"
  buttonText: "Subscribe"
  secondaryButtonText: "Maybe later"
  successMessage: "Welcome! Your comfort journey begins."

incentive:
  type: "freeShipping"
  value: "Free shipping"
  code: "COZYSHIP"

triggers:
  delay: 5000
  scrollPercent: 25
```

---

### 11. Bold Energy (Fitness)

```yaml
name: "Bold Energy"
industry: "Fitness, Gym, Sports Nutrition"
style: "Bold"
layout: "split-right"

image:
  description: "Dynamic fitness photography, athlete in motion,
    dramatic lighting with orange and dark tones, energy and power,
    sweat and determination, high contrast"
  format: "jpg"
  dimensions: "800x1000"
  style: "Sports Photography"
  path: "public/recipes/newsletter/bold-energy.jpg"

colors:
  background: "#0F0F0F"
  text: "#FFFFFF"
  description: "#B3B3B3"
  accent: "#FF6B35"
  button: "#FF6B35"
  buttonText: "#FFFFFF"
  inputBackground: "#1A1A1A"
  inputBorder: "#333333"

typography:
  fontFamily: "'Oswald', 'Impact', sans-serif"
  headlineSize: "2.25rem"
  headlineWeight: "700"
  descriptionSize: "1rem"

content:
  headline: "LEVEL UP"
  subheadline: "Training tips, nutrition guides, and exclusive member deals."
  emailPlaceholder: "Your email"
  buttonText: "JOIN THE TEAM"
  secondaryButtonText: "Not ready"
  successMessage: "Let's crush it! 💪"

incentive:
  type: "percentage"
  value: "15%"
  code: "POWER15"

triggers:
  delay: 4000
  scrollPercent: 20
```

---

### 12. Active Life (Outdoor/Sports)

```yaml
name: "Active Life"
industry: "Outdoor Gear, Activewear, Adventure"
style: "Fresh"
layout: "split-left"

image:
  description: "Outdoor adventure scene, hiking in mountains at golden hour,
    person with backpack overlooking scenic vista,
    teal and orange color grade, aspirational and adventurous"
  format: "jpg"
  dimensions: "800x1000"
  style: "Adventure Photography"
  path: "public/recipes/newsletter/active-life.jpg"

colors:
  background: "#F0F7F7"
  text: "#1A3A3A"
  description: "#4A6B6B"
  accent: "#2DD4BF"
  button: "#0D9488"
  buttonText: "#FFFFFF"
  inputBackground: "#FFFFFF"
  inputBorder: "#D1E7E7"

typography:
  fontFamily: "'Montserrat', 'Helvetica Neue', sans-serif"
  headlineSize: "1.875rem"
  headlineWeight: "600"
  descriptionSize: "1rem"

content:
  headline: "Adventure Awaits"
  subheadline: "Gear guides, trail tips, and exclusive outdoor deals."
  emailPlaceholder: "Enter your email"
  buttonText: "Explore More"
  secondaryButtonText: "Not today"
  successMessage: "Welcome to the adventure!"

incentive:
  type: "percentage"
  value: "10%"
  code: "EXPLORE10"

triggers:
  delay: 6000
  scrollPercent: 30
```

---

## Image Generation Notes

### Dimensions by Layout

| Layout | Dimensions | Aspect Ratio | Notes |
|--------|-----------|--------------|-------|
| split-left/right | 800×1000 | 4:5 (portrait) | Fits 45% width column |
| hero | 1200×400 | 3:1 (landscape) | Top banner, 120-200px height |
| full-background | 1200×800 | 3:2 | Covers entire popup |
| minimal | N/A | N/A | No image |

### Style Guidelines

1. **Leave negative space** - Especially for split layouts, leave room for text overlay if needed
2. **Consistent lighting** - Soft, natural lighting works best
3. **Color harmony** - Image should complement the color palette
4. **High quality** - Minimum 2x resolution for retina displays

### AI Image Prompts Tips

- Include "commercial photography" or "advertising" for professional look
- Specify lighting: "soft natural light", "golden hour", "studio lighting"
- Mention composition: "negative space on right", "centered subject"
- Add mood: "warm and inviting", "bold and energetic", "calm and peaceful"

---

## Implementation Checklist

For each recipe:

- [ ] Generate/source image
- [ ] Create recipe JSON configuration
- [ ] Test all layouts (desktop, tablet, mobile)
- [ ] Test with different popup sizes
- [ ] Verify incentive/discount code integration
- [ ] Test trigger behavior
- [ ] Screenshot for documentation
- [ ] Add to template picker UI


