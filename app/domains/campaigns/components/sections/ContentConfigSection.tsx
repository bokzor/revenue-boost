/**
 * Content Configuration Section Router
 *
 * Dynamically renders the appropriate content configuration form
 * based on the selected template type
 * Follows Strategy Pattern - different content strategies for different templates
 */

import type { TemplateType, ContentConfig, DesignConfig } from "../../types/campaign";
import { NewsletterContentSection } from "./NewsletterContentSection";
import type { NewsletterContent } from "./NewsletterContentSection";
import { SpinToWinContentSection } from "./SpinToWinContentSection";
import type { SpinToWinContent } from "./SpinToWinContentSection";
import { FlashSaleContentSection } from "./FlashSaleContentSection";
import type { FlashSaleContent } from "./FlashSaleContentSection";
import { ScratchCardContentSection } from "./ScratchCardContentSection";
import type { ScratchCardContent } from "./ScratchCardContentSection";

import { CartAbandonmentContentSection } from "./CartAbandonmentContentSection";
import { ProductUpsellContentSection } from "./ProductUpsellContentSection";
import { FreeShippingContentSection } from "./FreeShippingContentSection";
import type { FreeShippingContent } from "./FreeShippingContentSection";
import { SocialProofContentSection } from "./SocialProofContentSection";
import type { SocialProofContent as SPC } from "./SocialProofContentSection";
import { AnnouncementContentSection } from "./AnnouncementContentSection";
import type { AnnouncementContent } from "./AnnouncementContentSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

export interface ContentConfigSectionProps {
  templateType: TemplateType;
  content: Partial<ContentConfig>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<ContentConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  // Optional design threading for templates that include theme presets in content section
  designConfig?: Partial<DesignConfig>;
  onDesignChange?: (design: Partial<DesignConfig>) => void;
}

export function ContentConfigSection({
  templateType,
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
  designConfig,
  onDesignChange,
}: ContentConfigSectionProps) {
  const renderContentForm = () => {
    switch (templateType) {
      case "NEWSLETTER":
      case "EXIT_INTENT":
        return (
          <NewsletterContentSection
            content={content as Partial<NewsletterContent>}
            discountConfig={discountConfig}
            errors={errors}
            onChange={onChange as (c: Partial<NewsletterContent>) => void}
            onDiscountChange={onDiscountChange}
          />
        );

      case "SPIN_TO_WIN":
        return (
          <SpinToWinContentSection
            content={content as Partial<SpinToWinContent>}
            errors={errors}
            onChange={onChange as (c: Partial<SpinToWinContent>) => void}
          />
        );

      case "SCRATCH_CARD":
        return (
          <ScratchCardContentSection
            content={content as Partial<ScratchCardContent>}
            errors={errors}
            onChange={onChange as (c: Partial<ScratchCardContent>) => void}
          />
        );

      case "FLASH_SALE":
        return (
          <FlashSaleContentSection
            content={content as Partial<FlashSaleContent>}
            discountConfig={discountConfig}
            errors={errors}
            onChange={onChange as (c: Partial<FlashSaleContent>) => void}
            onDiscountChange={onDiscountChange}
          />
        );

      case "COUNTDOWN_TIMER":
        // COUNTDOWN_TIMER doesn't support discount issuance (no challenge token hook)
        // Use FlashSaleContentSection but without discount config
        return (
          <FlashSaleContentSection
            content={content as Partial<FlashSaleContent>}
            errors={errors}
            onChange={onChange as (c: Partial<FlashSaleContent>) => void}
            // Note: discountConfig and onDiscountChange intentionally omitted
          />
        );

      case "CART_ABANDONMENT":
        return (
          <CartAbandonmentContentSection
            content={content}
            discountConfig={discountConfig}
            errors={errors}
            onChange={onChange}
            onDiscountChange={onDiscountChange}
          />
        );

      case "PRODUCT_UPSELL":
        return (
          <ProductUpsellContentSection content={content} errors={errors} onChange={onChange} />
        );

      case "FREE_SHIPPING":
        return (
          <FreeShippingContentSection
            content={content as Partial<FreeShippingContent>}
            discountConfig={discountConfig}
            errors={errors}
            onChange={onChange as (c: Partial<FreeShippingContent>) => void}
            onDiscountChange={onDiscountChange}
            designConfig={designConfig}
            onDesignChange={onDesignChange}
          />
        );

      case "SOCIAL_PROOF":
        return (
          <SocialProofContentSection
            content={content as Partial<SPC>}
            errors={errors}
            onChange={onChange as (c: Partial<SPC>) => void}
          />
        );

      case "ANNOUNCEMENT":
        return (
          <AnnouncementContentSection
            content={content as Partial<AnnouncementContent>}
            errors={errors}
            onChange={onChange as (c: Partial<AnnouncementContent>) => void}
          />
        );

      default:
        return (
          <div>
            <p>Please select a template type to configure content</p>
          </div>
        );
    }
  };

  return renderContentForm();
}
