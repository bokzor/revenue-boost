export interface CssHook {
  selector: string;
  description: string;
}

export interface CssVariable {
  name: string;
  description: string;
}

export interface CssSnippet {
  id: string;
  name: string;
  description: string;
  css: string;
}

const SHARED_HOOKS: CssHook[] = [
  {
    selector: '[data-splitpop="true"]',
    description: "Root wrapper applied to every popup instance",
  },
  {
    selector: ".popup-portal-dialog-wrapper",
    description: "Dialog shell inside the overlay (good for padding/animations)",
  },
  {
    selector: ".popup-close-button",
    description: "Default close button in the top corner",
  },
];

const TEMPLATE_HOOKS: Record<string, CssHook[]> = {
  newsletter: [
    { selector: ".NewsletterPopup", description: "Newsletter popup container" },
    { selector: '[data-template="newsletter"]', description: "Newsletter popup root" },
    { selector: ".popup-grid-container", description: "Outer grid wrapper" },
    {
      selector: '[data-template="newsletter"] .email-popup-form-section',
      description: "Form area (inputs + buttons)",
    },
    {
      selector: '[data-template="newsletter"] .email-popup-button',
      description: "Primary CTA button",
    },
  ],
  "spin-to-win": [
    { selector: ".SpinToWinPopup", description: "Spin-to-Win popup container" },
    { selector: '[data-template="spin-to-win"]', description: "Spin-to-Win popup root" },
    { selector: ".popup-grid-container", description: "Outer grid wrapper" },
    {
      selector: '[data-template="spin-to-win"] .spin-wheel-wrapper',
      description: "The wheel surface",
    },
    {
      selector: '[data-template="spin-to-win"] .spin-form-content',
      description: "Copy + form column",
    },
  ],
  "product-upsell": [
    { selector: ".upsell-popup", description: "Upsell popup container" },
    { selector: '[data-template="product-upsell"]', description: "Upsell root" },
    { selector: ".popup-portal-dialog-wrapper", description: "Dialog shell (overlay)" },
    { selector: ".upsell-actions", description: "CTA row" },
  ],
  "scratch-card": [
    {
      selector: ".scratch-popup-container",
      description: "Scratch card container",
    },
    {
      selector: '[data-template="scratch-card"]',
      description: "Scratch card root",
    },
    {
      selector: '[data-template="scratch-card"] .scratch-popup-content',
      description: "Scratch card layout wrapper",
    },
    {
      selector: '[data-template="scratch-card"] .scratch-popup-button',
      description: "Submit/claim button",
    },
  ],
  "cart-abandonment": [
    {
      selector: ".cart-ab-popup-container",
      description: "Cart abandonment container",
    },
    {
      selector: '[data-template="cart-abandonment"]',
      description: "Cart abandonment root",
    },
    {
      selector: '[data-template="cart-abandonment"] .cart-ab-popup-form',
      description: "Form region",
    },
  ],
  "flash-sale": [
    { selector: ".flash-sale-container", description: "Flash sale popup container" },
    { selector: ".flash-sale-content", description: "Flash sale content body" },
  ],
  "free-shipping": [
    { selector: ".free-shipping-bar", description: "Free shipping bar container" },
    { selector: ".free-shipping-bar-content", description: "Inner content row" },
  ],
  announcement: [
    { selector: "[data-rb-banner]", description: "Announcement bar container" },
  ],
  "countdown-timer": [
    { selector: ".countdown-banner", description: "Countdown banner container" },
    { selector: "[data-rb-banner]", description: "Scoped banner root" },
  ],
  "social-proof": [
    { selector: "[data-rb-social-proof]", description: "Social proof notification container" },
  ],
};

export const CSS_VARIABLES: CssVariable[] = [
  { name: "--rb-popup-bg", description: "Popup background color" },
  { name: "--rb-popup-fg", description: "Primary text color" },
  { name: "--rb-popup-description-fg", description: "Secondary text color" },
  { name: "--rb-popup-primary-bg", description: "Primary button background" },
  { name: "--rb-popup-primary-fg", description: "Primary button text color" },
  { name: "--rb-popup-accent", description: "Accent/highlight color" },
  { name: "--rb-popup-radius", description: "Corner radius for cards" },
  { name: "--rb-popup-font-family", description: "Font family applied to content" },
  { name: "--rb-popup-max-w", description: "Max width of popup card" },
  { name: "--rb-popup-padding", description: "Inner padding for popup card" },
  { name: "--rb-popup-gap", description: "Gap between stacked elements" },
];

const SHARED_SNIPPETS: CssSnippet[] = [
  {
    id: "rounded-corners",
    name: "Rounded corners",
    description: "Soften edges on any popup container",
    css: "__TARGET__ {\n  border-radius: 14px;\n  overflow: hidden;\n}",
  },
  {
    id: "shadow-effect",
    name: "Drop shadow",
    description: "Add depth to the dialog shell",
    css: "__TARGET__ {\n  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.16);\n}",
  },
  {
    id: "gradient-background",
    name: "Gradient background",
    description: "Apply a bold gradient to the popup shell",
    css: '__TARGET__ {\n  background: linear-gradient(135deg, #111827 0%, #0f172a 50%, #312e81 100%);\n  color: #f9fafb;\n}\n\n.popup-close-button {\n  color: #f9fafb;\n}',
  },
  {
    id: "responsive-shell",
    name: "Responsive shell",
    description: "Tighten layout on mobile",
    css: "@media (max-width: 768px) {\n  .popup-portal-dialog-wrapper {\n    width: 95vw !important;\n    margin: 12px;\n    border-radius: 12px;\n  }\n}",
  },
  {
    id: "typography-base",
    name: "Typography polish",
    description: "Improve heading/body typography",
    css: '__TARGET__ h2 {\n  font-family: "Inter", "Helvetica Neue", -apple-system, sans-serif;\n  font-weight: 750;\n  letter-spacing: -0.3px;\n}\n\n__TARGET__ p {\n  line-height: 1.65;\n  font-size: 16px;\n}',
  },
  {
    id: "close-button",
    name: "Close button",
    description: "Style the dismiss button",
    css: ".popup-close-button {\n  top: 14px;\n  right: 14px;\n  background: rgba(0,0,0,0.08);\n  border-radius: 999px;\n  color: #0f172a;\n}\n\n.popup-close-button:hover {\n  background: rgba(0,0,0,0.16);\n}",
  },
];

const TEMPLATE_SNIPPETS: Record<string, CssSnippet[]> = {
  newsletter: [
    {
      id: "newsletter-button",
      name: "Primary button",
      description: "Accent the newsletter CTA",
      css: '.email-popup-button {\n  background: #111827;\n  color: #f9fafb;\n  border-radius: 10px;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n}',
    },
    {
      id: "newsletter-input",
      name: "Inputs",
      description: "Restyle input fields",
      css: '.email-popup-input {\n  border: 2px solid #111827;\n  border-radius: 10px;\n  box-shadow: 0 10px 30px rgba(17,24,39,0.08);\n}',
    },
  ],
  "spin-to-win": [
    {
      id: "spin-wheel",
      name: "Wheel glow",
      description: "Add glow behind the wheel",
      css: '.spin-wheel-wrapper {\n  box-shadow: 0 25px 70px rgba(79,70,229,0.35);\n  border: 6px solid rgba(79,70,229,0.35);\n  border-radius: 50%;\n}',
    },
    {
      id: "spin-form",
      name: "Form panel",
      description: "Card styling for form column",
      css: '.spin-form-content {\n  background: #ffffff;\n  border-radius: 18px;\n  padding: 24px;\n  box-shadow: 0 24px 60px rgba(15,23,42,0.12);\n}',
    },
  ],
  "product-upsell": [
    {
      id: "upsell-card",
      name: "Card polish",
      description: "Round corners and add border",
      css: ".upsell-popup {\n  border-radius: 16px;\n  border: 1px solid #e5e7eb;\n  overflow: hidden;\n}",
    },
    {
      id: "upsell-actions",
      name: "CTA row",
      description: "Even spacing on CTA row",
      css: ".upsell-actions {\n  gap: 12px;\n}\n.upsell-actions .upsell-cta {\n  flex: 1;\n  border-radius: 10px;\n  letter-spacing: 0.04em;\n}",
    },
  ],
  "scratch-card": [
    {
      id: "scratch-container",
      name: "Container frame",
      description: "Add frame around scratch card",
      css: ".scratch-popup-container {\n  border-radius: 18px;\n  border: 1px solid #e2e8f0;\n  box-shadow: 0 20px 50px rgba(15,23,42,0.16);\n}",
    },
    {
      id: "scratch-button",
      name: "Claim button",
      description: "Accent the claim button",
      css: ".scratch-popup-button {\n  background: linear-gradient(135deg, #22c55e, #16a34a);\n  color: #ffffff;\n  border: none;\n  border-radius: 12px;\n}",
    },
  ],
  "cart-abandonment": [
    {
      id: "cart-container",
      name: "Cart container",
      description: "Add depth to cart abandonment popup",
      css: ".cart-ab-popup-container {\n  border-radius: 16px;\n  box-shadow: 0 22px 60px rgba(0,0,0,0.18);\n}",
    },
    {
      id: "cart-primary",
      name: "Primary button",
      description: "Highlight the primary CTA",
      css: ".cart-ab-primary-button {\n  background: #111827;\n  color: #f8fafc;\n  border-radius: 10px;\n}",
    },
  ],
  "flash-sale": [
    {
      id: "flash-container",
      name: "Flash container",
      description: "Simple frame and shadow",
      css: ".flash-sale-container {\n  border-radius: 18px;\n  box-shadow: 0 24px 60px rgba(15,23,42,0.22);\n}",
    },
    {
      id: "flash-cta",
      name: "CTA styling",
      description: "Sharpen primary CTA",
      css: ".flash-sale-cta {\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  border-radius: 12px;\n}",
    },
  ],
  "free-shipping": [
    {
      id: "free-bar",
      name: "Bar background",
      description: "Bold gradient bar",
      css: ".free-shipping-bar {\n  background: linear-gradient(90deg, #111827, #1f2937, #0f172a);\n  color: #f9fafb;\n}\n.free-shipping-bar-close,\n.free-shipping-bar-dismiss {\n  color: #f9fafb;\n}",
    },
  ],
  announcement: [
    {
      id: "announce-bar",
      name: "Announcement bar",
      description: "Add border + shadow",
      css: "[data-rb-banner] {\n  box-shadow: 0 10px 30px rgba(0,0,0,0.12);\n  border-bottom: 1px solid rgba(255,255,255,0.2);\n}",
    },
  ],
  "countdown-timer": [
    {
      id: "countdown-bar",
      name: "Countdown bar",
      description: "Accent container + timer",
      css: ".countdown-banner {\n  border-bottom: 2px solid #111827;\n}\n.countdown-banner-timer-unit {\n  background: #111827;\n  color: #f9fafb;\n}",
    },
  ],
  "social-proof": [
    {
      id: "social-proof-card",
      name: "Notification card",
      description: "Round and shadow the notification",
      css: "[data-rb-social-proof] {\n  border-radius: 14px;\n  box-shadow: 0 18px 40px rgba(0,0,0,0.16);\n}",
    },
  ],
};

export function getCustomCssConfig(templateType?: string): {
  sharedHooks: CssHook[];
  templateHooks: CssHook[];
} {
  if (!templateType) {
    return { sharedHooks: SHARED_HOOKS, templateHooks: [] };
  }

  const normalized = templateType.toLowerCase().replace(/_/g, "-");
  const templateHooks = TEMPLATE_HOOKS[normalized] || [];

  return {
    sharedHooks: SHARED_HOOKS,
    templateHooks,
  };
}

export function getCssSnippets(templateType?: string): {
  sharedSnippets: CssSnippet[];
  templateSnippets: CssSnippet[];
} {
  if (!templateType) {
    return { sharedSnippets: SHARED_SNIPPETS, templateSnippets: [] };
  }

  const normalized = templateType.toLowerCase().replace(/_/g, "-");
  return {
    sharedSnippets: SHARED_SNIPPETS,
    templateSnippets: TEMPLATE_SNIPPETS[normalized] || [],
  };
}
