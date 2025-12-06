/**
 * Newsletter Design Recipes
 *
 * Pre-designed newsletter popup configurations for different industries and styles.
 * Each recipe includes complete design, content, and targeting configuration.
 *
 * @see docs/design-recipes/NEWSLETTER_RECIPES_PLAN.md
 */

import type { StyledRecipe, RecipeTag } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for newsletter recipes
// =============================================================================

const NEWSLETTER_EDITABLE_FIELDS = [
  {
    key: "headline",
    type: "text" as const,
    label: "Headline",
    group: "content",
    validation: { required: true, maxLength: 100 },
  },
  {
    key: "subheadline",
    type: "text" as const,
    label: "Description",
    group: "content",
    validation: { maxLength: 200 },
  },
  {
    key: "buttonText",
    type: "text" as const,
    label: "Button Text",
    group: "content",
    validation: { required: true, maxLength: 30 },
  },
  { key: "emailPlaceholder", type: "text" as const, label: "Email Placeholder", group: "content" },
];

const DISCOUNT_INPUT = {
  type: "discount_percentage" as const,
  key: "discountValue",
  label: "Discount Percentage",
  defaultValue: 10,
};

// Trigger type selection input
const TRIGGER_INPUT = {
  type: "select" as const,
  key: "triggerType",
  label: "When to show popup",
  defaultValue: "time_delay",
  options: [
    { value: "time_delay", label: "After a few seconds (recommended)" },
    { value: "exit_intent", label: "When visitor is about to leave" },
    { value: "scroll_depth", label: "After scrolling down the page" },
    { value: "page_load", label: "Immediately on page load" },
  ],
};

// =============================================================================
// 1. ELEGANT LUXE (Fashion/Luxury)
// =============================================================================

const elegantLuxe: StyledRecipe = {
  id: "newsletter-elegant-luxe",
  name: "Elegant Luxe",
  tagline: "Join the Inner Circle",
  description: "Best for premium brands where trust matters. Collects name for personalized VIP treatment.",
  icon: "✨",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: [
    "fashion",
    "luxury",
    "elegant",
    "split",
    "discount",
    "exit-intent",
    "time-delay",
  ] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "elegant-luxe",
  layout: "split-left",
  imageUrl: "/recipes/newsletter/elegant-luxe.jpg",
  featured: true,
  inputs: [{ ...DISCOUNT_INPUT, defaultValue: 15 }, TRIGGER_INPUT],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Join the Inner Circle",
      subheadline: "Be the first to discover new collections and receive exclusive offers.",
      emailPlaceholder: "Your email address",
      buttonText: "Subscribe",
      dismissLabel: "Maybe later",
      successMessage: "Welcome to the family.",
      // VIP feel - collect name for personalization
      nameFieldEnabled: true,
      nameFieldRequired: false,
      nameFieldPlaceholder: "Your first name",
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      backgroundColor: "#FAF9F7",
      textColor: "#1A1A1A",
      descriptionColor: "#6B6B6B",
      buttonColor: "#1A1A1A",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#E8E6E3",
      accentColor: "#C9A962",
      fontFamily: "'Playfair Display', Georgia, serif",
      // Layout configuration
      leadCaptureLayout: {
        desktop: "split-left",
        mobile: "content-only",
        visualSizeDesktop: "50%",
      },
      // Elegant rounded corners
      borderRadius: 16,
      buttonBorderRadius: 8,
      inputBorderRadius: 8,
      textAlign: "left",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 8000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

// =============================================================================
// 2. STREET STYLE (Urban Fashion)
// =============================================================================

const streetStyle: StyledRecipe = {
  id: "newsletter-street-style",
  name: "Street Style",
  tagline: "DROP ALERTS",
  description: "Perfect for limited drops and exclusive releases. Creates FOMO with early access hooks.",
  icon: "🔥",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["fashion", "bold", "dark", "split", "early-access"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "street-style",
  layout: "split-right",
  imageUrl: "/recipes/newsletter/street-style.jpg",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "DROP ALERTS",
      subheadline: "Never miss a release. Get exclusive early access to limited drops.",
      emailPlaceholder: "Enter email",
      buttonText: "GET ACCESS",
      dismissLabel: "Not now",
      successMessage: "You're in. 🔥",
      // Quick signup - email only, no friction
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "slide",
      backgroundColor: "#0A0A0A",
      textColor: "#FFFFFF",
      descriptionColor: "#A1A1A1",
      buttonColor: "#FF3366",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#1A1A1A",
      inputBorderColor: "#333333",
      accentColor: "#FF3366",
      fontFamily: "'Space Grotesk', 'Arial Black', sans-serif",
      // Layout configuration
      leadCaptureLayout: {
        desktop: "split-right",
        mobile: "content-only",
        visualSizeDesktop: "50%",
      },
      // Sharp, bold aesthetic
      borderRadius: 0,
      buttonBorderRadius: 0,
      inputBorderRadius: 0,
      buttonStyle: "filled",
      textAlign: "left",
      contentSpacing: "compact",
      boxShadow: "none",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
        scroll_depth: { enabled: true, depth_percentage: 25 },
      },
    },
  },
};

// =============================================================================
// 3. MINIMAL TECH (SaaS/Tech)
// =============================================================================

const minimalTech: StyledRecipe = {
  id: "newsletter-minimal-tech",
  name: "Minimal Tech",
  tagline: "Stay in the loop",
  description: "Low-friction signup for product updates. Great for SaaS, apps, or tech products.",
  icon: "💻",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["tech", "minimal", "modern", "centered", "no-incentive"] as RecipeTag[],
  component: "NewsletterMinimal",
  theme: "minimal-tech",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Stay in the loop",
      subheadline: "Weekly insights on product, design, and engineering.",
      emailPlaceholder: "you@company.com",
      buttonText: "Subscribe",
      dismissLabel: "No thanks",
      successMessage: "You're subscribed!",
      // Minimal - email only
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      descriptionColor: "#6B7280",
      buttonColor: "#111827",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#F9FAFB",
      inputBorderColor: "#E5E7EB",
      accentColor: "#6366F1",
      fontFamily: "'Inter', system-ui, sans-serif",
      // Layout configuration - content only (no image)
      leadCaptureLayout: {
        desktop: "content-only",
        mobile: "content-only",
      },
      // Pill-shaped, centered
      borderRadius: 12,
      buttonBorderRadius: 999, // Pill shape
      inputBorderRadius: 8,
      textAlign: "center",
      contentSpacing: "comfortable",
      inputStyle: "outlined",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 10000 },
        scroll_depth: { enabled: true, depth_percentage: 50 },
      },
    },
  },
};

// =============================================================================
// 4. DARK MODE (Tech/Gaming)
// =============================================================================

const darkMode: StyledRecipe = {
  id: "newsletter-dark-mode",
  name: "Dark Mode",
  tagline: "Join the Beta",
  description: "Ideal for beta signups and waitlists. Appeals to tech-savvy, developer-focused audiences.",
  icon: "🌙",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["tech", "dark", "modern", "centered", "early-access"] as RecipeTag[],
  component: "NewsletterMinimal",
  theme: "dark-mode",
  layout: "centered",
  useThemeBackground: true,
  inputs: [],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Join the Beta",
      subheadline: "Get early access to new features and shape the roadmap.",
      emailPlaceholder: "dev@example.com",
      buttonText: "Request Access",
      dismissLabel: "Learn more first",
      successMessage: "Check your inbox for next steps.",
      // Developer-friendly - no unnecessary fields
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
      textColor: "#FFFFFF",
      descriptionColor: "#A1A1AA",
      buttonColor: "#8B5CF6",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "rgba(255,255,255,0.1)",
      inputBorderColor: "rgba(255,255,255,0.2)",
      accentColor: "#8B5CF6",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      // Layout configuration - content only (no image)
      leadCaptureLayout: {
        desktop: "content-only",
        mobile: "content-only",
      },
      // Glassmorphism effect
      borderRadius: 16,
      buttonBorderRadius: 8,
      inputBorderRadius: 8,
      inputBackdropFilter: "blur(10px)",
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
      },
    },
  },
};

// =============================================================================
// 5. FRESH & ORGANIC (Food)
// =============================================================================

const freshOrganic: StyledRecipe = {
  id: "newsletter-fresh-organic",
  name: "Fresh & Organic",
  tagline: "Farm Fresh Updates",
  description: "Works well for recurring purchases like groceries. Highlights weekly deals and seasonal offers.",
  icon: "🥗",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["food", "warm", "split", "free-shipping"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "fresh-organic",
  layout: "split-left",
  imageUrl: "/recipes/newsletter/fresh-organic.jpg",
  inputs: [],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Farm Fresh Updates",
      subheadline: "Seasonal recipes, nutrition tips, and exclusive member discounts.",
      emailPlaceholder: "Your email",
      buttonText: "Join the Community",
      dismissLabel: "Not right now",
      successMessage: "Welcome! Your first recipe is on its way.",
      // Community-focused - email only
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      backgroundColor: "#FDFCFA",
      textColor: "#2D3319",
      descriptionColor: "#5C6442",
      buttonColor: "#7C9A3E",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#E2E5D8",
      accentColor: "#7C9A3E",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      // Layout configuration
      leadCaptureLayout: {
        desktop: "split-left",
        mobile: "content-only",
        visualSizeDesktop: "50%",
      },
      // Natural, organic feel
      borderRadius: 12,
      buttonBorderRadius: 24, // Rounded button
      inputBorderRadius: 8,
      textAlign: "left",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 30 },
      },
    },
    discountConfig: {
      enabled: true,
      valueType: "FREE_SHIPPING",
    },
  },
};

// =============================================================================
// 6. CAFE WARM (Coffee/Bakery)
// =============================================================================

const cafeWarm: StyledRecipe = {
  id: "newsletter-cafe-warm",
  name: "Cafe Warm",
  tagline: "Start Your Morning Right",
  description: "Great for local or artisan businesses. Creates a friendly, personal connection with visitors.",
  icon: "☕",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["food", "warm", "hero", "free-gift"] as RecipeTag[],
  component: "NewsletterHero",
  theme: "cafe-warm",
  layout: "hero",
  imageUrl: "/recipes/newsletter/cafe-warm.jpg",
  inputs: [],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Start Your Morning Right",
      subheadline: "Weekly brewing tips, new menu items, and loyalty rewards.",
      emailPlaceholder: "Enter your email",
      buttonText: "Sign Up",
      dismissLabel: "Maybe later",
      successMessage: "Welcome! Enjoy a free pastry on us.",
      // Cozy cafe feel - email only
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      backgroundColor: "#FDF8F3",
      textColor: "#3D2314",
      descriptionColor: "#7D5A43",
      buttonColor: "#3D2314",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#E8DDD4",
      accentColor: "#C4956A",
      fontFamily: "'Libre Baskerville', Georgia, serif",
      // Layout configuration - stacked (hero image on top)
      leadCaptureLayout: {
        desktop: "stacked",
        mobile: "stacked",
        visualSizeDesktop: "40%",
        visualSizeMobile: "30%",
        contentOverlap: "-2rem",
        visualGradient: true,
      },
      // Warm, inviting rounded corners
      borderRadius: 16,
      buttonBorderRadius: 8,
      inputBorderRadius: 8,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
      },
    },
  },
};

// =============================================================================
// 7. SOFT GLOW (Beauty)
// =============================================================================

const softGlow: StyledRecipe = {
  id: "newsletter-soft-glow",
  name: "Soft Glow",
  tagline: "Unlock Your Glow",
  description: "Builds trust for skincare and beauty. Uses subtle design to match premium product positioning.",
  icon: "💄",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["beauty", "elegant", "split", "discount"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "soft-glow",
  layout: "split-right",
  imageUrl: "/recipes/newsletter/soft-glow.jpg",
  featured: true,
  inputs: [{ ...DISCOUNT_INPUT, defaultValue: 20 }, TRIGGER_INPUT],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Unlock Your Glow",
      subheadline: "Beauty tips, exclusive launches, and member-only offers.",
      emailPlaceholder: "Enter your email",
      buttonText: "Join Now",
      dismissLabel: "No thanks",
      successMessage: "Welcome, gorgeous! Check your inbox.",
      // GDPR-compliant for EU beauty brands
      nameFieldEnabled: false,
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive beauty tips and offers",
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      backgroundColor: "#FFF9F9",
      textColor: "#2D2D2D",
      descriptionColor: "#6B6B6B",
      buttonColor: "#D4919A",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#F0E4E6",
      accentColor: "#E8B4BC",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      // Layout configuration
      leadCaptureLayout: {
        desktop: "split-right",
        mobile: "content-only",
        visualSizeDesktop: "50%",
      },
      // Soft, rounded aesthetic
      borderRadius: 20,
      buttonBorderRadius: 999, // Pill shape
      inputBorderRadius: 12,
      textAlign: "left",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 7000 },
        scroll_depth: { enabled: true, depth_percentage: 40 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

// =============================================================================
// 8. SPA SERENITY (Wellness)
// =============================================================================

const spaSerenity: StyledRecipe = {
  id: "newsletter-spa-serenity",
  name: "Spa Serenity",
  tagline: "Find Your Balance",
  description:
    "Premium wellness design with serif typography, floating social proof badge, and mindful consent flow.",
  icon: "🧘",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["wellness", "elegant", "split", "discount", "premium"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "spa-serenity",
  layout: "split-left",
  imageUrl: "/recipes/newsletter/spa-serenity.jpg",
  featured: true,
  inputs: [
    {
      ...DISCOUNT_INPUT,
      defaultValue: 10,
      type: "discount_percentage" as const,
      label: "Discount Percentage",
    },
    TRIGGER_INPUT,
  ],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Find Your Balance",
      subheadline: "Wellness tips, self-care rituals, and exclusive retreat offers delivered to your inbox.",
      emailPlaceholder: "Enter your email",
      buttonText: "Start Your Journey",
      dismissLabel: "Maybe later",
      successMessage: "Welcome to your wellness journey.",
      // Wellness - consent for mindful marketing
      nameFieldEnabled: true,
      nameFieldRequired: false,
      nameFieldPlaceholder: "Your first name",
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive wellness tips and exclusive offers",
      // New Spa Serenity features
      tagText: "Exclusive offers inside",
      tagIcon: "sparkle" as const,
      imageBadgeEnabled: true,
      imageBadgeIcon: "leaf" as const,
      imageBadgeTitle: "Join",
      imageBadgeValue: "10,000+ members",
      footerText: "Unsubscribe anytime. We respect your privacy.",
      successBadgeText: "10% off your first retreat",
      successBadgeIcon: "sparkle" as const,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      // Clean white background
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      descriptionColor: "#6B7280",
      // Wellness green accent
      buttonColor: "#166534",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#D1D5DB",
      inputTextColor: "#1F2937",
      accentColor: "#166534",
      // Serif headline font for elegance
      headlineFontFamily: "Georgia, 'Times New Roman', serif",
      // Layout configuration - split with image
      leadCaptureLayout: {
        desktop: "split-left",
        mobile: "content-only",
        visualSizeDesktop: "50%",
        visualSizeMobile: "0",
      },
      // Rounded corners for soft aesthetic
      borderRadius: 24,
      buttonBorderRadius: 12,
      inputBorderRadius: 12,
      textAlign: "left",
      contentSpacing: "comfortable",
      // Enhanced input styling
      inputBorderWidth: 2,
      inputFocusRingColor: "rgba(22, 101, 52, 0.1)",
      inputFocusRingWidth: 4,
      // Badge styling (wellness green theme)
      badgeBackgroundColor: "#F0FDF4",
      badgeTextColor: "#166534",
      badgeBorderRadius: 999,
      // Checkbox styling
      checkboxBorderRadius: 6,
      checkboxSize: 20,
      // Button shadow for depth
      buttonBoxShadow: "soft",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 8000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 9. SCANDINAVIAN (Home & Living)
// =============================================================================

const scandinavian: StyledRecipe = {
  id: "newsletter-scandinavian",
  name: "Scandinavian",
  tagline: "Design for Living",
  description: "Minimal design that won't clash with your product imagery. Best for design-conscious brands.",
  icon: "🏠",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["home", "minimal", "split", "discount"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "scandinavian",
  layout: "split-left",
  imageUrl: "/recipes/newsletter/scandinavian.jpg",
  inputs: [{ ...DISCOUNT_INPUT, defaultValue: 10 }],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Design for Living",
      subheadline: "Curated inspiration and exclusive access to new collections.",
      emailPlaceholder: "Enter your email",
      buttonText: "Join Us",
      dismissLabel: "Not now",
      successMessage: "Welcome home.",
      // Scandinavian simplicity - email only
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      backgroundColor: "#FFFFFF",
      textColor: "#1A1A1A",
      descriptionColor: "#717171",
      buttonColor: "#1A1A1A",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#F7F7F7",
      inputBorderColor: "#E5E5E5",
      accentColor: "#D4A574",
      fontFamily: "'Nunito Sans', 'Helvetica Neue', sans-serif",
      // Layout configuration
      leadCaptureLayout: {
        desktop: "split-left",
        mobile: "content-only",
        visualSizeDesktop: "50%",
      },
      // Clean Scandinavian aesthetic - underline inputs
      borderRadius: 0,
      buttonBorderRadius: 0,
      inputStyle: "underline",
      textAlign: "left",
      contentSpacing: "spacious",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 35 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 10. COZY COMFORT (Home/Lifestyle)
// =============================================================================

const cozyComfort: StyledRecipe = {
  id: "newsletter-cozy-comfort",
  name: "Cozy Comfort",
  tagline: "Sleep Better, Live Better",
  description: "Warm, reassuring design for high-consideration purchases. Builds confidence before buying.",
  icon: "🛋️",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["home", "warm", "hero", "free-shipping"] as RecipeTag[],
  component: "NewsletterHero",
  theme: "cozy-comfort",
  layout: "hero",
  imageUrl: "/recipes/newsletter/cozy-comfort.jpg",
  inputs: [],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Sleep Better, Live Better",
      subheadline: "Home styling tips and early access to seasonal sales.",
      emailPlaceholder: "Your email address",
      buttonText: "Subscribe",
      dismissLabel: "Maybe later",
      successMessage: "Welcome! Your comfort journey begins.",
      // Cozy home feel - email only
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      // Soft blue-grey palette for modern home/lifestyle feel
      backgroundColor: "#F5F7FA",
      textColor: "#2D3748",
      descriptionColor: "#5A6778",
      // Muted navy button for sophistication
      buttonColor: "#4A5568",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#CBD5E0",
      inputTextColor: "#2D3748",
      accentColor: "#718096",
      fontFamily: "'Source Serif Pro', Georgia, serif",
      // Layout configuration - stacked (hero image on top)
      leadCaptureLayout: {
        desktop: "stacked",
        mobile: "stacked",
        visualSizeDesktop: "40%",
        visualSizeMobile: "30%",
        contentOverlap: "-2rem",
        visualGradient: true,
      },
      // Soft, cozy aesthetic
      borderRadius: 20,
      buttonBorderRadius: 10,
      inputBorderRadius: 10,
      textAlign: "center",
      contentSpacing: "comfortable",
      boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.12)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
        scroll_depth: { enabled: true, depth_percentage: 25 },
      },
    },
    discountConfig: {
      enabled: true,
      valueType: "FREE_SHIPPING",
    },
  },
};

// =============================================================================
// 11. BOLD ENERGY (Fitness)
// =============================================================================

const boldEnergy: StyledRecipe = {
  id: "newsletter-bold-energy",
  name: "Bold Energy",
  tagline: "LEVEL UP",
  description: "High-impact fullscreen experience. Best for action-oriented audiences who respond to bold CTAs.",
  icon: "💪",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["fitness", "bold", "dark", "split", "discount"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "bold-energy",
  layout: "split-right",
  imageUrl: "/recipes/newsletter/bold-energy.jpg",
  featured: true,
  inputs: [{ ...DISCOUNT_INPUT, defaultValue: 15 }, TRIGGER_INPUT],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "LEVEL UP",
      subheadline: "Training tips, nutrition guides, and exclusive member deals.",
      emailPlaceholder: "Your email",
      buttonText: "JOIN THE TEAM",
      dismissLabel: "Not ready",
      successMessage: "Let's crush it! 💪",
      // Personalized fitness - collect name
      nameFieldEnabled: true,
      nameFieldRequired: true,
      nameFieldPlaceholder: "Your name",
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "slide",
      backgroundColor: "#0F0F0F",
      textColor: "#FFFFFF",
      descriptionColor: "#B3B3B3",
      buttonColor: "#FF6B35",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#1A1A1A",
      inputBorderColor: "#333333",
      accentColor: "#FF6B35",
      fontFamily: "'Oswald', 'Impact', sans-serif",
      // Layout configuration - fullscreen mobile for immersive experience
      leadCaptureLayout: {
        desktop: "split-right",
        mobile: "fullscreen",
        visualSizeDesktop: "50%",
        visualSizeMobile: "100%",
        contentOverlap: "-2rem",
        visualGradient: true,
      },
      // Bold, athletic aesthetic
      borderRadius: 8,
      buttonBorderRadius: 4,
      inputBorderRadius: 4,
      buttonStyle: "filled",
      textAlign: "left",
      contentSpacing: "compact",
      buttonBoxShadow: "0 4px 14px rgba(255, 107, 53, 0.4)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 4000 },
        scroll_depth: { enabled: true, depth_percentage: 20 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

// =============================================================================
// 12. ACTIVE LIFE (Outdoor/Adventure)
// =============================================================================

const activeLife: StyledRecipe = {
  id: "newsletter-active-life",
  name: "Active Life",
  tagline: "Adventure Awaits",
  description: "Energetic but not aggressive. Good for brands that inspire action without hard-selling.",
  icon: "🏔️",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  tags: ["outdoor", "modern", "split", "discount"] as RecipeTag[],
  component: "NewsletterSplit",
  theme: "active-life",
  layout: "split-left",
  imageUrl: "/recipes/newsletter/active-life.jpg",
  inputs: [{ ...DISCOUNT_INPUT, defaultValue: 10 }],
  editableFields: NEWSLETTER_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Adventure Awaits",
      subheadline: "Gear guides, trail tips, and exclusive outdoor deals.",
      emailPlaceholder: "Enter your email",
      buttonText: "Explore More",
      dismissLabel: "Not today",
      successMessage: "Welcome to the adventure!",
      // Adventurous - collect name for personalized recommendations
      nameFieldEnabled: true,
      nameFieldRequired: false,
      nameFieldPlaceholder: "Your name",
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      backgroundColor: "#F0F7F7",
      textColor: "#1A3A3A",
      descriptionColor: "#4A6B6B",
      buttonColor: "#0D9488",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#D1E7E7",
      accentColor: "#2DD4BF",
      fontFamily: "'Montserrat', 'Helvetica Neue', sans-serif",
      // Layout configuration
      leadCaptureLayout: {
        desktop: "split-left",
        mobile: "content-only",
        visualSizeDesktop: "50%",
      },
      // Fresh, outdoor aesthetic
      borderRadius: 12,
      buttonBorderRadius: 8,
      inputBorderRadius: 6,
      buttonStyle: "filled",
      textAlign: "left",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 30 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// CATALOG EXPORT
// =============================================================================

/** All newsletter design recipes */
export const NEWSLETTER_DESIGN_RECIPES: StyledRecipe[] = [
  elegantLuxe,
  streetStyle,
  minimalTech,
  darkMode,
  freshOrganic,
  cafeWarm,
  softGlow,
  spaSerenity,
  scandinavian,
  cozyComfort,
  boldEnergy,
  activeLife,
];

/** Get newsletter recipe by ID */
export function getNewsletterRecipeById(id: string): StyledRecipe | undefined {
  return NEWSLETTER_DESIGN_RECIPES.find((r) => r.id === id);
}

/** Get featured newsletter recipes */
export function getFeaturedNewsletterRecipes(): StyledRecipe[] {
  return NEWSLETTER_DESIGN_RECIPES.filter((r) => r.featured);
}

/** Get newsletter recipes by tag */
export function getNewsletterRecipesByTag(tag: RecipeTag): StyledRecipe[] {
  return NEWSLETTER_DESIGN_RECIPES.filter((r) => r.tags?.includes(tag));
}

/** Get newsletter recipes by industry tags */
export function getNewsletterRecipesByIndustry(industry: RecipeTag): StyledRecipe[] {
  const industryTags: RecipeTag[] = [
    "fashion",
    "beauty",
    "food",
    "tech",
    "fitness",
    "home",
    "outdoor",
    "wellness",
    "luxury",
  ];
  if (!industryTags.includes(industry)) return [];
  return NEWSLETTER_DESIGN_RECIPES.filter((r) => r.tags?.includes(industry));
}
