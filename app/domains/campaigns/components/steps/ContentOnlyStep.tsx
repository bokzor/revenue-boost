/**
 * ContentOnlyStep Component
 *
 * Renders only the template-specific content configuration.
 * This is the first part of the split from DesignContentStep.
 *
 * Handles:
 * - Template-specific content sections (Newsletter, Flash Sale, etc.)
 * - Headlines, button text, messages, form fields
 *
 * Does NOT handle:
 * - Colors, themes, backgrounds (see DesignOnlyStep)
 * - Custom CSS (see DesignOnlyStep)
 */

import { BlockStack } from "@shopify/polaris";
import { ContentConfigSection } from "../sections/ContentConfigSection";
import { NewsletterContentSection } from "../sections/NewsletterContentSection";
import type { NewsletterContent } from "../sections/NewsletterContentSection";
import { FlashSaleContentSection } from "../sections/FlashSaleContentSection";
import type { FlashSaleContent } from "../sections/FlashSaleContentSection";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { ContentConfig, DesignConfig, DiscountConfig } from "~/domains/campaigns/types/campaign";

export interface ContentOnlyStepProps {
  templateType: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  onContentChange: (content: Partial<ContentConfig>) => void;
  onDesignChange: (design: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function ContentOnlyStep({
  templateType,
  contentConfig,
  designConfig,
  discountConfig,
  onContentChange,
  onDesignChange,
  onDiscountChange,
}: ContentOnlyStepProps) {
  return (
    <BlockStack gap="400">
      {/* Template-specific Content Section */}
      {templateType === "NEWSLETTER" || templateType === "EXIT_INTENT" ? (
        <NewsletterContentSection
          content={contentConfig as Partial<NewsletterContent>}
          discountConfig={discountConfig}
          onChange={onContentChange as (c: Partial<NewsletterContent>) => void}
          onDiscountChange={onDiscountChange}
        />
      ) : templateType === "FLASH_SALE" ? (
        <FlashSaleContentSection
          content={contentConfig as Partial<FlashSaleContent>}
          discountConfig={discountConfig}
          errors={{}}
          onChange={onContentChange as (c: Partial<FlashSaleContent>) => void}
          onDiscountChange={onDiscountChange}
          templateType="FLASH_SALE"
        />
      ) : templateType === "COUNTDOWN_TIMER" ? (
        <FlashSaleContentSection
          content={contentConfig as Partial<FlashSaleContent>}
          errors={{}}
          onChange={onContentChange as (c: Partial<FlashSaleContent>) => void}
          templateType="COUNTDOWN_TIMER"
        />
      ) : (
        <ContentConfigSection
          templateType={templateType}
          content={contentConfig}
          discountConfig={discountConfig}
          onChange={onContentChange}
          onDiscountChange={onDiscountChange}
          designConfig={designConfig}
          onDesignChange={onDesignChange}
        />
      )}
    </BlockStack>
  );
}

