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
import { FormSection } from "../form";

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
          <div>
            <p>Cart Abandonment content configuration</p>
            {/* Will be implemented */}
          </div>
        );

      case "PRODUCT_UPSELL":
        return (
          <div>
            <p>Product Upsell content configuration</p>
            {/* Will be implemented */}
          </div>
        );

      case "SOCIAL_PROOF":
        return (
          <div>
            <p>Social Proof content configuration</p>
            {/* Will be implemented */}
          </div>
        );

      case "ANNOUNCEMENT":
        return (
          <div>
            <p>Announcement content configuration</p>
            {/* Will be implemented */}
          </div>
        );

      default:
        return (
          <div>
            <p>Please select a template type to configure content</p>
          </div>
        );
    }
  };

  return (
    <FormSection
      title="Content Configuration"
      description={`Configure the content for your ${templateType.toLowerCase().replace(/_/g, " ")} campaign`}
    >
      {renderContentForm()}
    </FormSection>
  );
}

