/**
 * Content Configuration Section Router
 *
 * Dynamically renders the appropriate content configuration form
 * based on the selected template type
 * Follows Strategy Pattern - different content strategies for different templates
 */

import type { TemplateType, ContentConfig } from "../../types/campaign";
import { NewsletterContentSection } from "./NewsletterContentSection";
import { SpinToWinContentSection } from "./SpinToWinContentSection";
import { FlashSaleContentSection } from "./FlashSaleContentSection";
import { CartAbandonmentContentSection } from "./CartAbandonmentContentSection";
import { ProductUpsellContentSection } from "./ProductUpsellContentSection";
import { FreeShippingContentSection } from "./FreeShippingContentSection";
import { SocialProofContentSection } from "./SocialProofContentSection";
import type { SocialProofContent as SPC } from "./SocialProofContentSection";
import { AnnouncementContentSection } from "./AnnouncementContentSection";

export interface ContentConfigSectionProps {
  templateType: TemplateType;
  content: Partial<ContentConfig>;
  errors?: Record<string, string>;
  onChange: (content: Partial<ContentConfig>) => void;
}

export function ContentConfigSection({
  templateType,
  content,
  errors,
  onChange,
}: ContentConfigSectionProps) {
  const renderContentForm = () => {
    switch (templateType) {
      case "NEWSLETTER":
      case "EXIT_INTENT":
        return (
          <NewsletterContentSection
            content={content}
            errors={errors}
            onChange={onChange}
          />
        );

      case "SPIN_TO_WIN":
      case "SCRATCH_CARD":
        return (
          <SpinToWinContentSection
            content={content}
            errors={errors}
            onChange={onChange}
          />
        );

      case "FLASH_SALE":
      case "COUNTDOWN_TIMER":
        return (
          <FlashSaleContentSection
            content={content}
            errors={errors}
            onChange={onChange}
          />
        );

      case "CART_ABANDONMENT":
        return (
          <CartAbandonmentContentSection
            content={content}
            errors={errors}
            onChange={onChange}
          />
        );

      case "PRODUCT_UPSELL":
        return (
          <ProductUpsellContentSection
            content={content}
            errors={errors}
            onChange={onChange}
          />
        );

      case "FREE_SHIPPING":
        return (
          <FreeShippingContentSection
            content={content}
            errors={errors}
            onChange={onChange}
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
            content={content}
            errors={errors}
            onChange={onChange}
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

