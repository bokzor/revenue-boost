# Campaign Creation UX - Named Recipes Proposal

## The Problem

Current flow is too abstract:
```
Goal → Template → Recipe → Configure → Configure → Configure...
```

Merchant just wants: **"I want to run a Flash Friday Sale"** 🔥

---

## The Solution: Named Campaign Recipes

Show **named campaigns** that merchants immediately recognize:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Create a Campaign                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📧 EMAIL & LEADS                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Welcome         │  │ Spin For        │  │ Scratch &       │     │
│  │ Discount        │  │ Prize           │  │ Win             │     │
│  │ 🎁              │  │ 🎡              │  │ 🎟️              │     │
│  │ "Get 10% off    │  │ "Spin the wheel │  │ "Scratch to     │     │
│  │  your first     │  │  for a chance   │  │  reveal your    │     │
│  │  order"         │  │  to win!"       │  │  prize!"        │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  🔥 SALES & PROMOS                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Flash Friday    │  │ BOGO            │  │ Holiday         │     │
│  │ Sale            │  │ Weekend         │  │ Countdown       │     │
│  │ 🔥              │  │ 🛍️              │  │ ⏰              │     │
│  │ "24 hours only! │  │ "Buy 2, Get 1   │  │ "Black Friday   │     │
│  │  30% off"       │  │  Free"          │  │  starts in..."  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  🛒 CART & RECOVERY                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Don't Leave     │  │ Free Shipping   │  │ Complete Your   │     │
│  │ Your Cart       │  │ Progress        │  │ Look            │     │
│  │ 🛒              │  │ 🚚              │  │ 👗              │     │
│  │ "Complete order │  │ "Spend $25 more │  │ "Customers also │     │
│  │  get 15% off"   │  │  for FREE ship" │  │  bought these"  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│                    [+ Build from scratch]                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Named Recipe Catalog

### 📧 Email & Leads

| Recipe Name | Tagline | Template | Quick Setup |
|-------------|---------|----------|-------------|
| **Welcome Discount** | "Get 10% off your first order" | NEWSLETTER | % off |
| **Spin For Prize** | "Spin the wheel for a chance to win!" | SPIN_TO_WIN | Prizes |
| **Scratch & Win** | "Scratch to reveal your prize!" | SCRATCH_CARD | Prizes |
| **Exit Offer** | "Wait! Here's 15% off before you go" | NEWSLETTER | % off |
| **VIP Early Access** | "Join the VIP list for exclusive access" | NEWSLETTER | None |

### 🔥 Sales & Promos

| Recipe Name | Tagline | Template | Quick Setup |
|-------------|---------|----------|-------------|
| **Flash Friday Sale** | "24 hours only! 30% off everything" | FLASH_SALE | %, duration |
| **Product Spotlight** | "Featured: [Product] - 20% off today!" | FLASH_SALE | Product, % |
| **Collection Sale** | "Summer Collection - Up to 40% off" | FLASH_SALE | Collection, % |
| **BOGO Weekend** | "Buy 2, Get 1 Free this weekend" | FLASH_SALE | Products |
| **Spend More Save More** | "Spend $50→10%, $100→20%, $150→30%" | FLASH_SALE | Tiers |
| **Holiday Countdown** | "Black Friday starts in 3 days..." | COUNTDOWN_TIMER | Date |
| **Free Gift Friday** | "Free gift with orders over $75!" | FLASH_SALE | Gift, threshold |

### 🛒 Cart & Recovery  

| Recipe Name | Tagline | Template | Quick Setup |
|-------------|---------|----------|-------------|
| **Don't Leave Your Cart** | "Complete your order and get 15% off" | CART_ABANDONMENT | % off |
| **Free Shipping Progress** | "Spend $25 more for FREE shipping!" | FREE_SHIPPING | Threshold |
| **Complete Your Look** | "Customers also bought these..." | PRODUCT_UPSELL | Products |
| **Bundle & Save** | "Add 3+ items and save 15%" | PRODUCT_UPSELL | %, quantity |

### 📢 Announcements

| Recipe Name | Tagline | Template | Quick Setup |
|-------------|---------|----------|-------------|
| **New Arrival Alert** | "Just dropped: [Product Name]" | ANNOUNCEMENT | Product |
| **Sale Announcement** | "Summer Sale Now Live!" | ANNOUNCEMENT | Message |
| **Store Update** | "We've updated our shipping policy" | ANNOUNCEMENT | Message |

---

## The Key Insight: Discount is Implicit

**The recipe determines the discount type, not the user:**

| Recipe | Discount Type | Why |
|--------|--------------|-----|
| Welcome Discount | Basic % | Simple incentive for email |
| Spin For Prize | Per-segment | Each prize is different |
| Flash Friday Sale | Basic % | Simple sitewide discount |
| BOGO Weekend | **BOGO** | ← Recipe implies BOGO |
| Spend More Save More | **Tiered** | ← Recipe implies Tiered |
| Free Gift Friday | **Free Gift** | ← Recipe implies Free Gift |
| Free Shipping Progress | Free Ship threshold | Built into template |

**No need to expose discount type selection!** The recipe decides.

---

## The Flow

```
Step 1: Pick "BOGO Weekend"
          ↓
Step 2: Quick Setup: "Which products?" (product picker)
          ↓
Step 3: Campaign created with:
        • Name: "BOGO Weekend"
        • Template: FLASH_SALE  
        • Discount: BOGO (Buy 2 Get 1 Free)  ← Automatic!
        • Content: Pre-filled copy
        • Design: Sale theme
          ↓
Step 4: Review & tweak (optional)
          ↓
Step 5: Publish! 🚀
```

---

## Power Users: "Build from Scratch"

For full control:

```
[+ Build from scratch]
    ↓
Choose Goal → Choose Template → Full Configuration
    ↓
Including manual discount type selection (Tiered, BOGO, Free Gift, etc.)
```

---

## Benefits

1. **Named campaigns** - "BOGO Weekend" not "Buy X Get Y discount"
2. **Discount is implicit** - No confusing discount type selection
3. **Fast creation** - Pick recipe + 1-2 questions = done
4. **Best practices built-in** - Triggers, targeting, copy pre-configured
5. **Still flexible** - "Build from scratch" for power users

---

## Next Steps

1. Finalize recipe names and taglines
2. Define quick setup fields per recipe
3. Create preview images
4. Extend `recipe-catalog.ts` with all recipes
5. Build recipe picker landing page

