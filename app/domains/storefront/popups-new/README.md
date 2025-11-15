# Storefront Popup Components

Professional, zero-dependency popup components for Shopify storefronts. Built from scratch with TypeScript, React hooks, and inline styles.

## Features

✅ **Zero External Dependencies** - Only React built-in hooks and standard browser APIs  
✅ **Fully Customizable** - Extensive prop-based configuration for colors, layout, and behavior  
✅ **Accessible** - ARIA labels, keyboard navigation, focus management  
✅ **Responsive** - Mobile, tablet, and desktop support  
✅ **Preview Mode** - Disable API calls for admin preview  
✅ **Reduced Motion** - Respects `prefers-reduced-motion` media query  
✅ **TypeScript** - Strict typing with comprehensive interfaces  
✅ **Production Ready** - Addresses all issues from template analysis  

## Components

### Newsletter Components

#### NewsletterPopup
Email collection popup with optional name fields, consent checkbox, and discount code display.

**Features:**
- Email validation
- Optional first/last name fields
- GDPR consent checkbox
- Discount code with copy-to-clipboard
- Success/error states
- Loading states

**Usage:**
```tsx
import { NewsletterPopup } from './popups-new';

<NewsletterPopup
  config={{
    id: 'newsletter-1',
    headline: 'Join Our Newsletter',
    subheadline: 'Get 10% off your first order',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    buttonColor: '#007BFF',
    buttonTextColor: '#FFFFFF',
    position: 'center',
    size: 'medium',
    emailPlaceholder: 'Enter your email',
    nameFieldEnabled: true,
    consentFieldEnabled: true,
    discount: {
      enabled: true,
      code: 'WELCOME10',
      percentage: 10,
    },
  }}
  isVisible={true}
  onClose={() => {}}
  onSubmit={async (data) => {
    // Handle submission
  }}
/>
```

### Gamification Components

#### SpinToWinPopup
Interactive spinning wheel with weighted probability selection.

**Features:**
- SVG-based wheel rendering
- Weighted probability selection
- Smooth rotation animation (4s default)
- Email capture before spin
- Prize reveal with celebration
- Copy discount code
- Respects reduced-motion

**Usage:**
```tsx
import { SpinToWinPopup } from './popups-new';

<SpinToWinPopup
  config={{
    id: 'spin-1',
    headline: 'Spin to Win!',
    backgroundColor: '#4A90E2',
    textColor: '#FFFFFF',
    buttonColor: '#FFD700',
    buttonTextColor: '#000000',
    position: 'center',
    size: 'large',
    wheelSegments: [
      {
        id: 'prize-10',
        label: '10% OFF',
        probability: 0.30,
        color: '#FF6B6B',
        discountType: 'percentage',
        discountValue: 10,
        discountCode: 'SPIN10',
      },
      // ... more prizes
    ],
    emailRequired: true,
    spinDuration: 4000,
    minSpins: 5,
  }}
  isVisible={true}
  onClose={() => {}}
  onSpin={async (email) => {}}
  onWin={(prize) => {}}
/>
```

#### ScratchCardPopup
Canvas-based scratch card with touch/mouse support.

**Features:**
- HTML5 Canvas scratch interaction
- Touch and mouse support
- Scratch percentage tracking
- Email capture (before or after)
- Prize reveal with confetti
- Configurable threshold (default 50%)
- Configurable brush radius (default 20px)

### Sales Components

#### FlashSalePopup
Urgency-driven flash sale with live countdown timer.

**Features:**
- **WORKING countdown timer** (not TODO!)
- Auto-update every second
- Auto-hide on expiry
- Optional stock counter
- Discount display
- Price comparison

**Usage:**
```tsx
<FlashSalePopup
  config={{
    id: 'flash-1',
    headline: '🔥 Flash Sale - 30% OFF!',
    backgroundColor: '#FF6B6B',
    textColor: '#FFFFFF',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#FF6B6B',
    position: 'center',
    size: 'medium',
    discountPercentage: 30,
    showCountdown: true,
    countdownDuration: 7200, // 2 hours
    hideOnExpiry: true,
    showStockCounter: true,
    stockCount: 47,
  }}
  isVisible={true}
  onClose={() => {}}
/>
```

#### CountdownTimerPopup
Banner-style countdown timer (top/bottom positioning).

**Features:**
- **WORKING countdown timer** (not TODO!)
- Compact format (HH:MM:SS)
- Sticky positioning option
- Color scheme presets
- Auto-hide on expiry

### E-commerce Components

#### CartAbandonmentPopup
Cart recovery with item display and urgency timer.

**Features:**
- Display cart items with images
- Show cart total
- Urgency countdown timer
- Discount code application
- "Save for Later" option
- Stock warnings

#### ProductUpsellPopup
Product recommendations with multi-select.

**Features:**
- Grid/carousel/card layouts
- Product images and prices
- Compare-at-price display
- Multi-select capability
- Bundle discount display
- Ratings and reviews

### Engagement Components

#### FreeShippingPopup
Free shipping threshold with progress bar.

**Features:**
- Progress bar (cart value vs threshold)
- Dynamic messaging
- Success state
- Product recommendations
- Banner/modal/sticky modes

#### SocialProofPopup
Social proof notifications (corner placement).

**Features:**
- Purchase notifications
- Visitor count notifications
- Review notifications
- Rotation system
- Configurable duration
- Corner positioning

#### AnnouncementPopup
Banner announcements (top/bottom).

**Features:**
- Top/bottom positioning
- Sticky option
- Color scheme presets
- Icon support
- CTA button

## Common Configuration

All popups extend `PopupConfig` with these common properties:

```typescript
interface PopupConfig {
  // Identification
  id: string;
  campaignId?: string;
  
  // Core Content
  headline: string;
  subheadline?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
  
  // Colors
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  accentColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  
  // Layout
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  borderRadius?: number;
  padding?: string | number;
  maxWidth?: string | number;
  animation?: 'fade' | 'slide' | 'bounce' | 'none';
  
  // Behavior
  previewMode?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  autoCloseDelay?: number;
}
```

## Utility Functions

```typescript
// Email validation
validateEmail(email: string): boolean

// Currency formatting
formatCurrency(amount: number | string, currency?: string): string

// Copy to clipboard
copyToClipboard(text: string): Promise<boolean>

// Time calculations
calculateTimeRemaining(endDate: Date | string): TimeRemaining
formatTimeRemaining(time: TimeRemaining): string

// Accessibility
prefersReducedMotion(): boolean
```

## Migration from Old Components

The new components address all issues identified in the template analysis:

1. ✅ **Spin-to-Win Double Chance** - Now has complete prize configuration
2. ✅ **Scratch & Win** - Now has prizes and scratch configuration
3. ✅ **Countdown Timer** - Timer is fully implemented (not TODO!)
4. ✅ **Flash Sale** - Has working countdown timer
5. ✅ **All Upsells** - Support product configuration
6. ✅ **Newsletter** - Support discount configuration

## Best Practices

1. **Always provide required props** - Check TypeScript interfaces
2. **Use preview mode** - Set `previewMode: true` in admin
3. **Handle callbacks** - Implement onSubmit, onClose, etc.
4. **Test accessibility** - Use keyboard navigation
5. **Test mobile** - All components are responsive
6. **Respect reduced motion** - Animations disabled automatically

## File Structure

```
popups-new/
├── PopupPortal.tsx            # Shadow DOM popup portal + backdrop
├── types.ts                   # Shared TypeScript interfaces
├── utils.ts                   # Utility functions
├── NewsletterPopup.tsx        # Newsletter component
├── SpinToWinPopup.tsx         # Spin to win component
├── ScratchCardPopup.tsx       # Scratch card component
├── FlashSalePopup.tsx         # Flash sale component
├── CountdownTimerPopup.tsx    # Countdown timer component
├── CartAbandonmentPopup.tsx   # Cart recovery component
├── ProductUpsellPopup.tsx     # Product upsell component
├── FreeShippingPopup.tsx      # Free shipping component
├── SocialProofPopup.tsx       # Social proof component
├── AnnouncementPopup.tsx      # Announcement component
├── index.ts                   # Exports
└── README.md                  # This file
```

## License

Internal use only - Revenue Boost application.

