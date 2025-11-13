What are the manuel test I should execute for FlashCard ?

Based on the Flash Sale implementation we just completed, here's a comprehensive manual test plan for FlashSaleContentSection:

## 🧪 Flash Sale Manual Test Plan

### Pre-requisites
```bash
# Start dev server with emulators
npm run start:dev

# Or just the app
npm run dev
```
---

## 1️⃣ **Content Section Tests**

### Test 1.1: Basic Content Fields
- [ ] Navigate to `/app/campaigns/new`
- [ ] Select "Flash Sale" template
- [ ] Fill in all required fields:
  - **Headline**: "Flash Sale! 50% Off"
  - **Urgency Message**: "Only 2 hours left!"
  - **Button Text**: "Shop Now"
  - **Success Message**: "Discount applied!"
- [ ] **Verify**: All fields accept input
- [ ] **Verify**: Required fields show validation errors when empty

### Test 1.2: Optional Content Fields
- [ ] Fill **Subheadline**: "Don't miss out"
- [ ] Fill **CTA URL**: "/collections/sale"
- [ ] Fill **Failure Message**: "Something went wrong"
- [ ] **Verify**: Optional fields can be left empty
- [ ] **Verify**: No validation errors for optional fields

---

## 2️⃣ **Advanced Features Section Tests**

### Test 2.1: Timer Configuration (Duration Mode)
- [ ] Click "Show" on Advanced Timer section
- [ ] Select **Timer Mode**: "Duration (countdown from now)"
- [ ] Set **Duration**: 120 minutes
- [ ] Set **Urgency Threshold**: 30 minutes
- [ ] Fill **Timer Label**: "Sale ends in:"
- [ ] Fill **Expired Message**: "Sale has ended"
- [ ] **Verify**: All timer fields are visible
- [ ] **Verify**: Duration accepts numeric values

### Test 2.2: Timer Configuration (Fixed End Time)
- [ ] Select **Timer Mode**: "Fixed end time"
- [ ] Pick a future date/time
- [ ] **Verify**: Date picker works correctly
- [ ] **Verify**: Can't select past dates (if validation exists)

### Test 2.3: Timer Configuration (Personal Timer)
- [ ] Select **Timer Mode**: "Personal timer (per user)"
- [ ] Set **Duration**: 60 minutes
- [ ] **Verify**: Duration field shows for personal timer

### Test 2.4: Timer Configuration (Stock Limited)
- [ ] Select **Timer Mode**: "Stock-limited (urgency)"
- [ ] Fill **Urgency Message**: "Limited stock!"
- [ ] **Verify**: Stock-related fields appear

### Test 2.5: Inventory Tracking (Real Mode)
- [ ] Click "Show" on Inventory Tracking section
- [ ] Select **Inventory Mode**: "Real (Shopify product)"
- [ ] Enter **Product GID**: "gid://shopify/Product/123456789"
- [ ] Set **Low Stock Threshold**: 10
- [ ] Set **Critical Stock Threshold**: 3
- [ ] Fill **Low Stock Message**: "Only {stock} left!"
- [ ] Fill **Sold Out Message**: "Sold out!"
- [ ] **Verify**: All real inventory fields accept input
- [ ] **Verify**: GID validation (should start with "gid://")

### Test 2.6: Inventory Tracking (Pseudo Mode)
- [ ] Select **Inventory Mode**: "Pseudo (simulated)"
- [ ] Set **Initial Stock**: 50
- [ ] Set **Min Stock**: 5
- [ ] Set **Decrement Interval**: 60 seconds
- [ ] **Verify**: Pseudo inventory fields work
- [ ] **Verify**: Numeric validations apply

### Test 2.7: Reservation Timer
- [ ] Click "Show" on Soft Reservation section
- [ ] Check **Enable Reservation Timer**
- [ ] Set **Reservation Duration**: 10 minutes
- [ ] Fill **Reservation Label**: "Offer reserved for:"
- [ ] Fill **Disclaimer**: "Inventory not guaranteed"
- [ ] **Verify**: All reservation fields work
- [ ] **Verify**: Duration accepts numeric values

---

## 3️⃣ **Discount Configuration Tests**

### Test 3.1: Basic Discount
- [ ] Select **Discount Strategy**: "Basic discount"
- [ ] Select **Discount Type**: "Percentage"
- [ ] Enter **Value**: 20
- [ ] Enter **Discount Code**: "FLASH20"
- [ ] **Verify**: Basic discount form works
- [ ] **Verify**: Percentage accepts 0-100

### Test 3.2: Tiered Discount
- [ ] Select **Discount Strategy**: "Tiered discount"
- [ ] Click "Add Tier"
- [ ] Set **Tier 1**: Spend $50, Get 10% off
- [ ] Click "Add Tier"
- [ ] Set **Tier 2**: Spend $100, Get 20% off
- [ ] Click "Add Tier"
- [ ] Set **Tier 3**: Spend $200, Get 30% off
- [ ] **Verify**: Can add multiple tiers
- [ ] **Verify**: Can remove tiers
- [ ] **Verify**: Tier thresholds increase

### Test 3.3: BOGO Discount
- [ ] Select **Discount Strategy**: "BOGO deal"
- [ ] Set **Buy Quantity**: 2
- [ ] Set **Get Quantity**: 1
- [ ] Select **Get Discount Type**: "Free"
- [ ] **Verify**: BOGO fields work
- [ ] **Verify**: Can switch between Free/Percentage/Fixed

### Test 3.4: Free Gift Discount
- [ ] Select **Discount Strategy**: "Free gift with purchase"
- [ ] Set **Minimum Purchase**: 75
- [ ] Enter **Gift Product GID**: "gid://shopify/Product/987654321"
- [ ] Fill **Gift Description**: "Free tote bag"
- [ ] **Verify**: Free gift fields work
- [ ] **Verify**: GID validation applies

---

## 4️⃣ **Design Section Tests** (NEW!)

### Test 4.1: Visual Theme Swatches
- [ ] Scroll to Design section
- [ ] **Verify**: See 8 theme swatches in 4-column grid
- [ ] **Verify**: Each swatch shows CTA preview button
- [ ] Hover over each swatch
- [ ] **Verify**: Tooltip shows theme name

### Test 4.2: Theme Selection via Swatches
- [ ] Click **"Urgent Red"** swatch
- [ ] **Verify**: All color fields update instantly
- [ ] **Verify**: Background becomes white, primary red
- [ ] Click **"Midnight Sale"** swatch
- [ ] **Verify**: Background becomes dark (#0f172a)
- [ ] **Verify**: Primary becomes cyan (#38bdf8)
- [ ] Click **"Neon Flash"** swatch
- [ ] **Verify**: Background dark, primary yellow
- [ ] Click **"Gradient Pop"** swatch
- [ ] **Verify**: Background shows gradient colors

### Test 4.3: Theme Selection via Dropdown
- [ ] Open theme dropdown
- [ ] **Verify**: All 8 themes listed with formatted names
  - "Urgent Red"
  - "Hot Deal"
  - "Midnight Sale"
  - "Neon Flash"
  - "Elegant Sale"
  - "Minimal Clean"
  - "Gradient Pop"
  - "Luxury Offer"
- [ ] Select "Elegant Sale"
- [ ] **Verify**: Colors update to amber tones

### Test 4.4: Individual Color Customization
**After selecting "Urgent Red" theme:**
- [ ] Click **Background Color** swatch (36px square)
- [ ] **Verify**: Native color picker opens
- [ ] Choose a blue color
- [ ] **Verify**: Preview swatch updates
- [ ] **Verify**: Hex field shows new value (e.g., #3b82f6)
- [ ] Type hex value directly: "#10b981"
- [ ] **Verify**: Preview swatch updates

### Test 4.5: All Color Fields Work
Test each ColorField independently:
- [ ] **Background Color**: Change to #ffffff
- [ ] **Text Color**: Change to #1f2937
- [ ] **Description Color**: Change to #6b7280
- [ ] **Accent Color**: Change to #3b82f6
- [ ] **Success Color**: Change to #10b981
- [ ] **Button Background**: Change to #ef4444
- [ ] **Button Text**: Change to #ffffff
- [ ] **Overlay Color**: Change to #000000

### Test 4.6: Position & Size Controls
- [ ] Select **Position**: Center
- [ ] **Verify**: Position updates in preview (if preview exists)
- [ ] Select **Position**: Top
- [ ] Select **Position**: Bottom
- [ ] Select **Position**: Left
- [ ] Select **Position**: Right
- [ ] Select **Size**: Small
- [ ] Select **Size**: Medium
- [ ] Select **Size**: Large
- [ ] **Verify**: All options selectable

### Test 4.7: Overlay Settings
- [ ] Change **Overlay Color** to #000000 (black)
- [ ] Set **Overlay Opacity**: 0%
- [ ] **Verify**: Opacity dropdown shows 0-100%
- [ ] Set **Overlay Opacity**: 50%
- [ ] Set **Overlay Opacity**: 100%
- [ ] **Verify**: All opacity levels selectable

### Test 4.8: Presentation Options
- [ ] Select **Badge Style**: Pill
- [ ] Select **Badge Style**: Tag
- [ ] Check **Show Timer in Popup**
- [ ] Uncheck **Show Timer in Popup**
- [ ] Check **Show Inventory in Popup**
- [ ] Uncheck **Show Inventory in Popup**
- [ ] **Verify**: All checkboxes toggle correctly

### Test 4.9: Legacy Options
- [ ] Check **Hide on Expiry (Legacy)**
- [ ] **Verify**: Checkbox toggles
- [ ] Check **Auto-Hide on Expire**
- [ ] **Verify**: Checkbox toggles

---

## 5️⃣ **Integration Tests**

### Test 5.1: Save Campaign with All Features
- [ ] Fill all Content fields
- [ ] Configure Duration timer (120 min)
- [ ] Configure Real inventory (with valid Product GID)
- [ ] Enable Reservation timer (10 min)
- [ ] Configure Tiered discount (3 tiers)
- [ ] Select "Neon Flash" theme
- [ ] Customize Button Background to red
- [ ] Set Overlay Opacity to 80%
- [ ] Click "Save Campaign"
- [ ] **Verify**: Campaign saves successfully
- [ ] **Verify**: No validation errors

### Test 5.2: Load Saved Campaign
- [ ] Navigate to campaign list
- [ ] Click Edit on saved Flash Sale campaign
- [ ] **Verify**: All Content fields populated correctly
- [ ] **Verify**: Timer mode and settings restored
- [ ] **Verify**: Inventory settings restored
- [ ] **Verify**: Discount strategy restored (Tiered)
- [ ] **Verify**: All 3 tiers displayed
- [ ] **Verify**: Design colors match saved values
- [ ] **Verify**: Overlay opacity shows 80%

### Test 5.3: Theme Switch After Custom Colors
- [ ] Load campaign with custom colors
- [ ] Note current Button Background color
- [ ] Click "Urgent Red" theme swatch
- [ ] **Verify**: ALL colors reset to theme defaults
- [ ] **Verify**: Custom colors are overwritten
- [ ] Change Button Background to orange
- [ ] Click "Minimal Clean" theme
- [ ] **Verify**: Button Background resets to theme's button color

---

## 6️⃣ **Validation Tests**

### Test 6.1: Required Field Validation
- [ ] Leave **Headline** empty
- [ ] Leave **Urgency Message** empty
- [ ] Leave **Button Text** empty
- [ ] Leave **Success Message** empty
- [ ] Click "Save"
- [ ] **Verify**: Validation errors show for all required fields
- [ ] **Verify**: Error messages are clear

### Test 6.2: Numeric Field Validation
- [ ] Enter negative number in **Duration**
- [ ] Enter 0 in **Low Stock Threshold**
- [ ] Enter text in **Initial Stock** (pseudo inventory)
- [ ] **Verify**: Validation errors or input rejection

### Test 6.3: GID Format Validation
- [ ] Enter invalid GID: "123456" (no gid:// prefix)
- [ ] **Verify**: Validation error (if implemented)
- [ ] Enter valid GID: "gid://shopify/Product/123456789"
- [ ] **Verify**: Accepted

### Test 6.4: Color Format Validation
- [ ] Enter invalid hex: "ZZZZZZ"
- [ ] **Verify**: Rejected or auto-corrected
- [ ] Enter valid hex: "#3b82f6"
- [ ] **Verify**: Accepted
- [ ] Enter short hex: "#fff"
- [ ] **Verify**: Accepted or expanded to #ffffff

---

## 7️⃣ **UI/UX Tests**

### Test 7.1: Collapsible Sections
- [ ] **Verify**: Advanced Timer starts collapsed
- [ ] Click "Show" → **Verify**: Section expands smoothly
- [ ] Click "Hide" → **Verify**: Section collapses
- [ ] Repeat for Inventory Tracking
- [ ] Repeat for Soft Reservation

### Test 7.2: Responsive Layout
- [ ] Resize browser to mobile width (375px)
- [ ] **Verify**: Theme swatches stack properly
- [ ] **Verify**: FormGrid columns stack on mobile
- [ ] **Verify**: Color pickers usable on mobile

### Test 7.3: Theme Swatch Visual Quality
- [ ] **Verify**: Urgent Red swatch shows red background
- [ ] **Verify**: Midnight Sale swatch shows dark background
- [ ] **Verify**: Gradient Pop swatch shows purple gradient
- [ ] **Verify**: CTA preview buttons visible on all swatches
- [ ] **Verify**: No layout overflow or broken styles

### Test 7.4: Color Picker Usability
- [ ] Click Background Color swatch
- [ ] **Verify**: Color picker opens natively
- [ ] Pick a color visually
- [ ] **Verify**: Hex field updates
- [ ] **Verify**: Preview swatch updates
- [ ] Type hex directly
- [ ] **Verify**: Preview swatch updates

---

## 8️⃣ **Edge Cases**

### Test 8.1: Very Long Text
- [ ] Enter 500 characters in Headline
- [ ] **Verify**: Field handles long text or shows character limit
- [ ] Enter 1000 characters in Urgency Message
- [ ] **Verify**: Proper truncation or scrolling

### Test 8.2: Special Characters
- [ ] Enter emoji in Headline: "🔥 Flash Sale 🔥"
- [ ] **Verify**: Emoji displays correctly
- [ ] Enter special chars: "50% Off! #FLASH2025"
- [ ] **Verify**: Special characters accepted

### Test 8.3: Concurrent Discount Strategies
- [ ] Select Tiered discount, add 3 tiers
- [ ] Switch to BOGO
- [ ] **Verify**: Tiered config hidden
- [ ] Switch back to Tiered
- [ ] **Verify**: Tiers still present or cleared (expected behavior)

### Test 8.4: Theme Switching Stress Test
- [ ] Click all 8 themes rapidly in sequence
- [ ] **Verify**: No UI lag or broken state
- [ ] **Verify**: Colors always update correctly
- [ ] **Verify**: No console errors

---

## 9️⃣ **TypeScript/Console Tests**

### Test 9.1: Browser Console
- [ ] Open DevTools Console
- [ ] Perform all theme switches
- [ ] **Verify**: No TypeScript errors
- [ ] **Verify**: No React warnings
- [ ] **Verify**: No "key" prop warnings

### Test 9.2: Network Requests
- [ ] Open DevTools Network tab
- [ ] Save campaign
- [ ] **Verify**: POST request succeeds (200 status)
- [ ] **Verify**: Request payload includes all fields
- [ ] **Verify**: `designConfig` contains all colors
- [ ] **Verify**: `contentConfig` contains timer/inventory/reservation

---

## 🎯 **Critical Path Summary**

**Must Pass** (Priority 1):
1. ✅ All 8 theme swatches visible and clickable
2. ✅ Theme selection updates all color fields
3. ✅ Individual color pickers work
4. ✅ Campaign saves with theme colors
5. ✅ Campaign loads with saved colors
6. ✅ Required field validation works
7. ✅ Tiered discount add/remove works
8. ✅ Timer mode switching works

**Should Pass** (Priority 2):
9. ✅ All collapsible sections work
10. ✅ GID validation for products/collections
11. ✅ Overlay opacity control works
12. ✅ Position and size selectors work

**Nice to Have** (Priority 3):
13. ✅ Mobile responsive layout
14. ✅ Special character handling
15. ✅ Theme switching performance
16. ✅ No console errors

---

## 📋 **Test Completion Checklist**

After completing all tests:
- [ ] All Content fields work ✓
- [ ] All Advanced Features (Timer/Inventory/Reservation) work ✓
- [ ] All Discount strategies (Basic/Tiered/BOGO/Free Gift) work ✓
- [ ] All 8 themes selectable via swatches ✓
- [ ] All 8 themes selectable via dropdown ✓
- [ ] All 8 color pickers work ✓
- [ ] Overlay color and opacity work ✓
- [ ] Position and size selectors work ✓
- [ ] Campaign saves successfully ✓
- [ ] Campaign loads correctly ✓
- [ ] No TypeScript errors ✓
- [ ] No console warnings ✓

---

## 🐛 **Bug Report Template**

If you find issues, document them like this:

```markdown
**Bug**: Theme swatch not updating button background

**Steps to Reproduce**:
1. Select "Urgent Red" theme
2. Observe button background color

**Expected**: Button background should be #ef4444
**Actual**: Button background is #3b82f6

**Environment**: Chrome 120, macOS Sonoma
**Severity**: Medium
**Screenshot**: [attach if relevant]
```
---

## 🚀 **Next Steps After Testing**

Once manual tests pass:
1. ✅ Add unit tests for theme helper functions
2. ✅ Add E2E tests for theme switching
3. ✅ Test storefront popup rendering with theme colors
4. ✅ Performance test with large campaigns
5. ✅ Accessibility audit (keyboard navigation, screen readers)

---

Good luck with testing! 🎉 Let me know if you find any issues.
