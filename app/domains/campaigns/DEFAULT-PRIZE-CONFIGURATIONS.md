# Default Prize Configurations

## Summary

Profitable default prize configurations for gamification popups (Spin-to-Win and Scratch Card) designed to maximize engagement while protecting profit margins.

**Date**: 2025-11-11  
**Status**: ✅ COMPLETE

---

## 🎯 Design Philosophy

### Goals
1. **Engagement** - Exciting prizes that encourage participation
2. **Profitability** - Expected discount lower than cart abandonment loss
3. **Fairness** - Transparent probabilities, everyone wins something
4. **Simplicity** - Easy to understand prize structure

### Benchmarks
- **Cart Abandonment Loss**: 15-20% of potential revenue
- **Target Expected Discount**: 8-12% (profitable margin)
- **Conversion Lift**: Gamification typically increases conversion by 20-30%

---

## 🎡 Spin-to-Win Default Configuration

### Prize Structure

| Prize | Probability | Discount | Code | Color |
|-------|------------|----------|------|-------|
| 5% OFF | 35% | 5% | SPIN5 | Green (#10B981) |
| 10% OFF | 25% | 10% | SPIN10 | Blue (#3B82F6) |
| 15% OFF | 15% | 15% | SPIN15 | Orange (#F59E0B) |
| 20% OFF | 10% | 20% | SPIN20 | Red (#EF4444) |
| FREE SHIPPING | 10% | ~$5-10 | FREESHIP | Purple (#8B5CF6) |
| Try Again | 5% | 0% | - | Gray (#6B7280) |

### Expected Value Calculation

```
Expected Discount = Σ(Probability × Discount)

= (0.35 × 5%) + (0.25 × 10%) + (0.15 × 15%) + (0.10 × 20%) + (0.10 × 0%) + (0.05 × 0%)
= 1.75% + 2.50% + 2.25% + 2.00% + 0% + 0%
= 8.50%
```

**Plus Free Shipping**: ~10% get free shipping (worth ~$5-10)

**Total Expected Cost**: ~9.75% per spin

### Why This Works

✅ **Profitable**: 9.75% < 15-20% cart abandonment loss  
✅ **Engaging**: 95% win rate (only 5% "Try Again")  
✅ **Balanced**: Mix of small (common) and large (rare) prizes  
✅ **Flexible**: Free shipping as alternative to discount  
✅ **Re-engagement**: "Try Again" encourages email capture  

### Probability Distribution

```
High Probability (60%)
├─ 5% OFF  (35%) ← Most common, low cost
└─ 10% OFF (25%) ← Moderate discount

Medium Probability (25%)
├─ 15% OFF (15%) ← Good discount
└─ 20% OFF (10%) ← Great discount

Low Probability (15%)
├─ FREE SHIPPING (10%) ← Alternative value
└─ Try Again     (5%)  ← No prize
```

---

## 🎫 Scratch Card Default Configuration

### Prize Structure

| Prize | Probability | Discount | Code |
|-------|------------|----------|------|
| 5% OFF | 40% | 5% | SCRATCH5 |
| 10% OFF | 30% | 10% | SCRATCH10 |
| 15% OFF | 20% | 15% | SCRATCH15 |
| 20% OFF | 10% | 20% | SCRATCH20 |

### Expected Value Calculation

```
Expected Discount = Σ(Probability × Discount)

= (0.40 × 5%) + (0.30 × 10%) + (0.20 × 15%) + (0.10 × 20%)
= 2.00% + 3.00% + 3.00% + 2.00%
= 10.00%
```

**Total Expected Cost**: 10% per scratch

### Why This Works

✅ **Profitable**: 10% < 15-20% cart abandonment loss  
✅ **Engaging**: 100% win rate (everyone gets a discount)  
✅ **Simple**: Only percentage discounts (easier to manage)  
✅ **Balanced**: Weighted toward smaller discounts  
✅ **Guaranteed Value**: No "Try Again" - builds trust  

### Probability Distribution

```
High Probability (70%)
├─ 5% OFF  (40%) ← Most common
└─ 10% OFF (30%) ← Common

Low Probability (30%)
├─ 15% OFF (20%) ← Uncommon
└─ 20% OFF (10%) ← Rare
```

---

## 📊 Comparison

| Metric | Spin-to-Win | Scratch Card |
|--------|-------------|--------------|
| Expected Discount | 9.75% | 10.00% |
| Win Rate | 95% | 100% |
| Prize Types | 6 | 4 |
| Complexity | Higher | Lower |
| Re-engagement | Yes (Try Again) | No |
| Free Shipping | Yes | No |

---

## 💰 ROI Analysis

### Assumptions
- Average Order Value: $100
- Cart Abandonment Rate: 70%
- Gamification Conversion Lift: 25%

### Without Gamification
```
100 visitors → 30 conversions → $3,000 revenue
```

### With Spin-to-Win (9.75% expected discount)
```
100 visitors → 37.5 conversions → $3,750 revenue
Discount cost: $3,750 × 9.75% = $365.63
Net revenue: $3,750 - $365.63 = $3,384.37

ROI: ($3,384.37 - $3,000) / $365.63 = 105% ROI
```

### With Scratch Card (10% expected discount)
```
100 visitors → 37.5 conversions → $3,750 revenue
Discount cost: $3,750 × 10% = $375
Net revenue: $3,750 - $375 = $3,375

ROI: ($3,375 - $3,000) / $375 = 100% ROI
```

**Both configurations are highly profitable!**

---

## 🎨 Color Psychology

### Spin-to-Win Colors
- **Green (#10B981)** - 5% OFF - Safe, common, positive
- **Blue (#3B82F6)** - 10% OFF - Trust, moderate value
- **Orange (#F59E0B)** - 15% OFF - Excitement, good value
- **Red (#EF4444)** - 20% OFF - Urgency, best value
- **Purple (#8B5CF6)** - Free Shipping - Premium, special
- **Gray (#6B7280)** - Try Again - Neutral, try again

### Visual Balance
The wheel is visually balanced with:
- Warm colors (red, orange) for high-value prizes
- Cool colors (blue, green) for common prizes
- Purple for alternative value (free shipping)
- Gray for non-prize segment

---

## 🔧 Customization Guidelines

### Increasing Profitability
To reduce expected discount:
1. Increase probability of 5% OFF
2. Decrease probability of 20% OFF
3. Add more "Try Again" segments
4. Replace high discounts with free shipping

### Increasing Engagement
To increase win rate:
1. Remove "Try Again" segment
2. Add more prize tiers
3. Increase probability of mid-tier prizes
4. Add non-discount prizes (free gift, etc.)

### Seasonal Adjustments
- **Black Friday**: Increase all discounts by 5-10%
- **New Customer**: Add "First Order" specific prizes
- **Clearance**: Higher discounts acceptable
- **Premium Products**: Lower discounts, add free shipping

---

## ✅ Implementation

### Spin-to-Win
```typescript
const DEFAULT_WHEEL_SEGMENTS = [
  { id: "segment-5-off", label: "5% OFF", probability: 0.35, ... },
  { id: "segment-10-off", label: "10% OFF", probability: 0.25, ... },
  { id: "segment-15-off", label: "15% OFF", probability: 0.15, ... },
  { id: "segment-20-off", label: "20% OFF", probability: 0.10, ... },
  { id: "segment-free-shipping", label: "FREE SHIPPING", probability: 0.10, ... },
  { id: "segment-try-again", label: "Try Again", probability: 0.05, ... },
];
```

### Scratch Card
```typescript
const DEFAULT_SCRATCH_CARD_PRIZES = [
  { id: "prize-5-off", label: "5% OFF", probability: 0.40, ... },
  { id: "prize-10-off", label: "10% OFF", probability: 0.30, ... },
  { id: "prize-15-off", label: "15% OFF", probability: 0.20, ... },
  { id: "prize-20-off", label: "20% OFF", probability: 0.10, ... },
];
```

---

## 📈 Success Metrics

Track these metrics to validate profitability:
- ✅ Conversion rate lift
- ✅ Average order value
- ✅ Discount redemption rate
- ✅ Email capture rate
- ✅ Customer lifetime value
- ✅ Net revenue per visitor

---

**Status**: ✅ **PROFITABLE & READY**  
Default configurations are designed for maximum ROI while maintaining engagement!

