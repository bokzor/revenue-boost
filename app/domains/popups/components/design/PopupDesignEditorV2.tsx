import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Card,
  Layout,
  Button,
  Text,
  Box,
  BlockStack,
  Collapsible,
  InlineStack,
  TextField,
  Select,
  FormLayout,
  Checkbox,
  Badge,
  Modal,
  Icon,
  ButtonGroup,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PaintBrushFlatIcon,
  WandIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import { TemplateSelector as CampaignTemplateSelector } from "~/domains/campaigns/components/TemplateSelector";
import { LivePreviewPanel } from "../preview/LivePreviewPanel";
import { CustomCSSEditor } from "./CustomCSSEditor";
import type { CampaignGoal } from "@prisma/client";
import styles from "./PopupDesignEditorV2.module.css";
import { getTemplateSections } from "./TemplateConfigFields";
import type { ContentFieldDefinition } from "~/lib/content-config";
import { DiscountSection } from "./DiscountSection";
import { PrizeListEditor, type PrizeItem } from "./PrizeListEditor";
import { WheelColorEditor } from "./WheelColorEditor";
import { Affix } from "~/shared/components/ui/Affix";

import type {
  AnimationSettings,
  AnimationConfig,
  PopupDesignConfig,
  TemplateObject,
  EnhancedTriggersConfig,
  DiscountConfig,
  PendingTemplateChange,
} from "~/domains/popups/types/design-editor.types";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type {
  TargetRulesConfig,
  ContentConfig,
  DesignConfig,
} from "~/domains/campaigns/types/campaign";

// Temporary stub for AnimationUtils until the real implementation is created
const AnimationUtils = {
  getAnimationById: (_id: string): AnimationConfig | null => null,
  applyAnimation: async (
    _element: HTMLElement,
    _animation: AnimationConfig | null,
    _config: Partial<AnimationConfig> | AnimationSettings,
    _variation?: string
  ): Promise<void> => {
    console.warn("AnimationUtils.applyAnimation not implemented yet");
  },
};

// Temporary stub for convertDatabaseTriggersAuto until the real implementation is created
const convertDatabaseTriggersAuto = (triggers: unknown): EnhancedTriggersConfig => {
  console.warn("convertDatabaseTriggersAuto not implemented yet, returning triggers as-is");
  return triggers as EnhancedTriggersConfig;
};

// Re-export for backward compatibility
export type { PopupDesignConfig };

/**
 * PopupDesignEditorV2 Component
 *
 * Complete design and content customization for campaign popups.
 * Includes template selection with live preview.
 *
 * @param initialConfig - Initial design configuration
 * @param initialTemplateId - Pre-selected template ID
 * @param campaignGoal - Campaign goal for template filtering
 * @param templateType - Type of template being customized
 * @param onConfigChange - Callback when config changes
 * @param onTemplateChange - Callback when template changes
 * @param onSave - Optional save callback
 * @param onCancel - Optional cancel callback
 * @param isLoading - Loading state
 * @param campaignContext - Context for smart recommendations
 */
export interface PopupDesignEditorProps {
  initialConfig?: Partial<PopupDesignConfig>;
  initialTemplateId?: string;
  campaignGoal: string; // Required - must be valid CampaignGoal enum value
  templateType?: TemplateType;
  storeId: string; // Required for template fetching
  onConfigChange: (config: PopupDesignConfig) => void;
  onTemplateChange?: (
    templateId: string,
    templateType: TemplateType,
    enhancedTriggers?: EnhancedTriggersConfig,
    templateObject?: TemplateObject
  ) => void;
  campaignId?: string;
  discountConfig?: DiscountConfig;
  onDiscountChange?: (config: DiscountConfig) => void;
  shopDomain?: string;
  isLoading?: boolean;
}

const defaultAnimations: AnimationSettings = {
  entrance: {
    animation: "fadeIn",
    duration: 300,
    easing: "ease-out",
    delay: 0,
  },
  exit: {
    animation: "fadeOut",
    duration: 200,
    easing: "ease-in",
    delay: 0,
  },
  hover: {
    enabled: false,
    animation: "none",
    duration: 200,
    easing: "ease-in-out",
  },
  attention: {
    enabled: false,
    animation: "none",
    duration: 1000,
    easing: "ease-in-out",
    interval: 5,
  },
};

// Section icons mapping
const SECTION_ICONS = {
  template: PaintBrushFlatIcon,
  templateConfig: SettingsIcon,
  animations: WandIcon,
  advanced: SettingsIcon,
};

export const PopupDesignEditorV2: React.FC<PopupDesignEditorProps> = ({
  initialConfig,
  initialTemplateId,
  campaignGoal,
  templateType,
  storeId,
  onConfigChange,
  onTemplateChange,
  campaignId,
  discountConfig,
  onDiscountChange,
  shopDomain,
  isLoading = false,
}) => {
  // Validate campaign goal - throw error for invalid values
  const validCampaignGoals = ["NEWSLETTER_SIGNUP", "INCREASE_REVENUE", "ENGAGEMENT"];
  if (!validCampaignGoals.includes(campaignGoal)) {
    throw new Error(
      `[PopupDesignEditorV2] Invalid campaign goal: "${campaignGoal}". Must be one of: ${validCampaignGoals.join(", ")}`
    );
  }
  const validatedCampaignGoal = campaignGoal;

  // Selected template state - will be populated from database via CampaignTemplateSelector
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateObject | null>(null);

  // Local state for current template type (for immediate preview updates)
  const [currentTemplateType, setCurrentTemplateType] = useState<string | undefined>(templateType);
  const animationDebounceTimerRef = useRef<NodeJS.Timeout>();
  const previousAnimationsRef = useRef<AnimationSettings | null>(null);

  // Initialize selectedTemplate when editing a campaign with an existing template
  useEffect(() => {
    if (initialTemplateId && templateType && !selectedTemplate) {
      console.log("[PopupDesignEditorV2] Initializing selectedTemplate for editing:", {
        initialTemplateId,
        templateType,
      });
      // Initialize with the actual template instance ID for correct selection
      setSelectedTemplate({
        id: initialTemplateId,
        templateId: initialTemplateId, // instance ID
        name: templateType,
        templateType: templateType,
        category: templateType,
        description: "",
      });
    }
  }, [initialTemplateId, templateType, selectedTemplate]);

  // Template change warning state
  const [showTemplateChangeWarning, setShowTemplateChangeWarning] = useState(false);
  const [pendingTemplateChange, setPendingTemplateChange] = useState<PendingTemplateChange | null>(
    null
  );
  const isEditingCampaign = !!campaignId;

  // Preview element for animation targeting
  const [previewElement, setPreviewElement] = useState<HTMLElement | null>(null);

  const [designConfig, setDesignConfig] = useState<PopupDesignConfig>(() => {
    const initConfig = initialConfig as Record<string, unknown> | undefined;
    return {
      id: "popup-design",
      // Content fields (using unified field names)
      headline: (initConfig?.headline as string) || "Your Popup Title",
      subheadline: (initConfig?.subheadline as string) || "Your popup description goes here.",
      buttonText:
        (initConfig?.buttonText as string) || (initConfig?.ctaText as string) || "Click Here",
      successMessage: (initConfig?.successMessage as string) || "Thank you!",
      // Design fields
      backgroundColor: "#FFFFFF",
      textColor: "#333333",
      buttonColor: "#007BFF",
      buttonTextColor: "#FFFFFF",
      position: "center",
      size: "medium",
      showCloseButton: true,
      overlayOpacity: 0.6,
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      customCSS: "",
      fontWeight: "normal",
      padding: "24px",
      animations: defaultAnimations,
      // Apply all initial config (will override defaults above)
      ...initialConfig,
    };
  });

  // Update design config when initialConfig changes (for variant switching)
  useEffect(() => {
    console.log(
      "[PopupDesignEditorV2] 🔄 initialConfig changed, updating design config:",
      initialConfig
    );

    setDesignConfig((prev) => ({
      ...prev,
      ...initialConfig,
    }));
    setDebouncedConfig((prev) => ({
      ...prev,
      ...initialConfig,
    }));
  }, [initialConfig]);

  // Debounced config state for preview (300ms debounce)
  const [debouncedConfig, setDebouncedConfig] = useState(designConfig);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Collapsible sections state - Dynamic based on template
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    template: true,
    discount: true,
    animations: false,
    advanced: false,
  });

  // Helper to determine if discount section should be shown
  const shouldShowDiscountSection = useCallback(() => {
    // HIDE for templates with their own per-prize discount systems
    if (
      currentTemplateType &&
      [
        "lottery", // Spin to Win has per-prize discounts
        "scratch-card", // Scratch card has per-prize discounts
      ].includes(currentTemplateType)
    ) {
      return false;
    }

    // Show for newsletter and revenue goals
    if (
      validatedCampaignGoal === "NEWSLETTER_SIGNUP" ||
      validatedCampaignGoal === "INCREASE_REVENUE"
    ) {
      return true;
    }
    // No template-specific whitelist needed; rely on goal-based logic above
    return false;
  }, [validatedCampaignGoal, currentTemplateType]);

  // Get template sections dynamically using current template type
  const templateSections = useMemo(() => {
    console.log("[PopupDesignEditorV2] Getting template sections for:", currentTemplateType);
    const sections = currentTemplateType ? getTemplateSections(currentTemplateType) : [];
    console.log(
      "[PopupDesignEditorV2] Template sections:",
      sections.map((s) => ({ key: s.key, fieldCount: s.fields.length }))
    );
    return sections;
  }, [currentTemplateType]);

  // Sync currentTemplateType with prop changes
  useEffect(() => {
    setCurrentTemplateType(templateType);
  }, [templateType]);

  // Initialize template section states when template changes
  useEffect(() => {
    if (currentTemplateType && templateSections.length > 0) {
      setOpenSections((prev) => {
        const newSections = { ...prev };
        templateSections.forEach((section) => {
          // Only set if not already defined (preserve user's open/close state)
          if (!(section.key in newSections)) {
            newSections[section.key] = section.defaultOpen;
          }
        });
        // Ensure discount section is included if not already set
        if (!("discount" in newSections)) {
          newSections.discount = shouldShowDiscountSection();
        }
        return newSections;
      });
    }
  }, [currentTemplateType, templateSections, shouldShowDiscountSection]);

  // Apply template selection (extracted for reuse)
  const applyTemplateSelection = useCallback(
    async (templateId: string, templateType: TemplateType, templateObject?: TemplateObject) => {
      console.log("Applying template selection:", {
        templateId,
        templateType,
        hasTemplateObject: !!templateObject,
      });

      // Use the template object passed from TemplateSelector (already has all data from database)
      let fetchedDesign: Record<string, unknown> | null = null;
      let fetchedContent: Record<string, unknown> | null = null;
      let fetchedTriggers: TargetRulesConfig | null = null;
      let template: TemplateObject | null = null;

      if (templateObject) {
        // Template object already has all the data we need from the database
        console.log("Using template object from selector (no API call needed)");

        // Read from strongly-typed TemplateObject fields
        fetchedDesign = (templateObject.designConfig || {}) as Record<string, unknown>;
        fetchedContent = (templateObject.contentConfig || {}) as Record<string, unknown>;
        fetchedTriggers = (templateObject.targetRules || null) as TargetRulesConfig | null;

        template = {
          id: templateObject.id,
          templateId,
          name: templateObject.name || templateType,
          templateType: templateObject.templateType || templateType,
          category: templateObject.category || templateType,
          description:
            (typeof templateObject.description === "string" ? templateObject.description : null) ||
            "Campaign description goes here",
          preview:
            (typeof templateObject.preview === "string" ? templateObject.preview : null) ||
            "/templates/default-preview.png",
          contentConfig: fetchedContent || undefined,
          designConfig: fetchedDesign || undefined,
          targetRules: (fetchedTriggers || undefined) as Record<string, unknown> | undefined,
        };
      } else {
        // Fallback: template object not provided (shouldn't happen in normal flow)
        console.warn("Template object not provided, using minimal fallback");
        template = {
          id: `template-${templateId}`,
          templateId,
          name: templateType,
          templateType: templateType,
          category: templateType,
          description: "Campaign description goes here",
          preview: "/templates/default-preview.png",
        };
      }

      if (template) {
        console.log("Setting selected template:", template.templateId);
        setSelectedTemplate(template);
      }

      // Update local template type immediately for preview
      console.log("[PopupDesignEditorV2] Setting currentTemplateType to:", templateType);
      setCurrentTemplateType(templateType);

      // Apply template defaults to design config (prefer fetched DB values when available)
      const newConfig = {
        ...designConfig,
        // Merge all content defaults from database (includes template-specific fields)
        ...(fetchedContent || {}),
        // Merge all design fields from database template (includes background image settings)
        ...(fetchedDesign || {}),
        // Design fields from template (fallback to existing designConfig)
        backgroundColor:
          (fetchedDesign?.backgroundColor ?? template?.backgroundColor) ||
          designConfig.backgroundColor,
        textColor: (fetchedDesign?.textColor ?? template?.textColor) || designConfig.textColor,
        buttonColor:
          (fetchedDesign?.buttonColor ?? template?.buttonColor) || designConfig.buttonColor,
        buttonTextColor:
          (fetchedDesign?.buttonTextColor ?? template?.buttonTextColor) ||
          designConfig.buttonTextColor,
        position: (fetchedDesign?.position ?? template?.position) || designConfig.position,
        size: (fetchedDesign?.size ?? template?.size) || designConfig.size,
        showCloseButton:
          fetchedDesign?.showCloseButton ??
          template?.showCloseButton ??
          designConfig.showCloseButton,
        overlayOpacity:
          fetchedDesign?.overlayOpacity ?? template?.overlayOpacity ?? designConfig.overlayOpacity,
        // Reset animations to default when switching templates
        animations: fetchedDesign?.animations || defaultAnimations,
      } as typeof designConfig;

      console.log("[PopupDesignEditorV2] Applied template config:", {
        templateType,
        hasContentDefaults: !!fetchedContent,
        contentFields: fetchedContent ? Object.keys(fetchedContent) : [],
        newConfigFields: Object.keys(newConfig),
      });

      setDesignConfig(newConfig);
      setDebouncedConfig(newConfig);
      onConfigChange(newConfig);

      // Convert and apply template triggers if available
      if (fetchedTriggers) {
        console.log("[PopupDesignEditorV2] Template triggers (DB format):", fetchedTriggers);

        // Extract enhancedTriggers from the nested structure if present
        // Templates store triggers as: { enhancedTriggers: {...}, targetingRules: {...}, ... }
        const triggersToConvert = (fetchedTriggers as Record<string, unknown>).enhancedTriggers || fetchedTriggers;

        const enhancedTriggers = convertDatabaseTriggersAuto(triggersToConvert);
        console.log(
          "[PopupDesignEditorV2] Converted triggers (enhanced format):",
          enhancedTriggers
        );

        // Notify parent about trigger changes with template object
        onTemplateChange?.(templateId, templateType, enhancedTriggers, templateObject);
      } else {
        // Notify parent about template change without triggers but with template object
        onTemplateChange?.(templateId, templateType, undefined, templateObject);
      }
    },
    [designConfig, onConfigChange, onTemplateChange]
  );

  // Handle template selection with warning for existing campaigns
  const handleTemplateSelect = useCallback(
    (template: TemplateObject) => {
      const { id: templateId, templateType } = template;

      console.log("handleTemplateSelect called with:", {
        templateId,
        templateType,
        isEditingCampaign,
        initialTemplateId,
        hasContentDefaults: !!template.contentDefaults,
      });

      // If editing an existing campaign and selecting the same template
      // Only update the templateId without applying defaults
      if (isEditingCampaign && initialTemplateId && templateId === initialTemplateId) {
        console.log(
          "Same template selected during edit, updating templateId only without applying defaults"
        );
        // Just notify parent about template selection without changing config
        onTemplateChange?.(templateId, templateType, undefined, template);
        return;
      }

      // If editing an existing campaign and template is different, show warning
      if (isEditingCampaign && initialTemplateId && templateId !== initialTemplateId) {
        console.log("Template change detected during edit, showing warning");
        setPendingTemplateChange({ templateId, templateType, template });
        setShowTemplateChangeWarning(true);
        return;
      }

      // Proceed with template selection (new campaign or no initial template)
      applyTemplateSelection(templateId, templateType, template);
    },
    [isEditingCampaign, initialTemplateId, applyTemplateSelection, onTemplateChange]
  );

  // Wrapper to convert SelectedTemplate to TemplateObject
  const handleCampaignTemplateSelect = useCallback(
    (selectedTemplate: {
      id: string;
      templateType: TemplateType;
      name: string;
      contentConfig?: ContentConfig;
      targetRules?: TargetRulesConfig;
      designConfig?: DesignConfig;
    }) => {
      const templateObject: TemplateObject = {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        templateType: selectedTemplate.templateType,
        category: selectedTemplate.templateType,
        description: "",
        contentConfig: selectedTemplate.contentConfig as Record<string, unknown>,
        designConfig: selectedTemplate.designConfig as Record<string, unknown>,
        targetRules: selectedTemplate.targetRules as Record<string, unknown>,
      };
      handleTemplateSelect(templateObject);
    },
    [handleTemplateSelect]
  );

  // Handle template change confirmation
  const handleConfirmTemplateChange = useCallback(() => {
    if (pendingTemplateChange) {
      applyTemplateSelection(
        pendingTemplateChange.templateId,
        pendingTemplateChange.templateType,
        pendingTemplateChange.template
      );
      setPendingTemplateChange(null);
      setShowTemplateChangeWarning(false);
    }
  }, [pendingTemplateChange, applyTemplateSelection]);

  // Handle template change cancellation
  const handleCancelTemplateChange = useCallback(() => {
    setPendingTemplateChange(null);
    setShowTemplateChangeWarning(false);
  }, []);

  // Accordion mode state
  const [accordionMode, setAccordionMode] = useState(false);

  // Animation preview trigger function
  const triggerAnimationPreview = useCallback(
    async (
      type: "entrance" | "exit" | "hover" | "attention",
      animationSettings: AnimationSettings
    ) => {
      // Use the stored preview element reference instead of DOM query
      if (!previewElement) {
        console.warn("No preview element available for animation");
        return;
      }

      try {
        const settings = animationSettings[type];
        if (!settings) return;

        const animation = AnimationUtils.getAnimationById(settings.animation);

        if (!animation) return;

        const config = {
          name: settings.animation,
          duration: settings.duration,
          easing: settings.easing,
          delay: "delay" in settings ? settings.delay : 0,
        };

        const variation: string | undefined =
          "variation" in settings &&
          typeof (settings as Record<string, unknown>).variation === "string"
            ? ((settings as Record<string, unknown>).variation as string)
            : undefined;

        // For entrance animations: play exit animation, wait 1 sec, then play entrance animation
        if (type === "entrance" && animationSettings.exit) {
          // First, play the exit animation
          const exitAnimationId = animationSettings.exit.animation;
          const exitAnimation = AnimationUtils.getAnimationById(exitAnimationId);

          if (exitAnimation) {
            const exitConfig: Partial<AnimationConfig> = {
              name: exitAnimationId,
              duration: animationSettings.exit.duration,
              easing: animationSettings.exit.easing,
              delay: 0,
            };

            await AnimationUtils.applyAnimation(previewElement, exitAnimation, exitConfig);
          }

          // Keep element hidden after exit animation
          previewElement.style.opacity = "0";
          previewElement.style.visibility = "hidden";
          previewElement.style.animation = "none";

          // Wait 1000ms (1 second)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Make element visible again before entrance animation
          previewElement.style.visibility = "visible";
          previewElement.style.opacity = "";
          previewElement.style.transform = "";
          previewElement.style.animation = "none";
          void previewElement.offsetHeight;

          await AnimationUtils.applyAnimation(previewElement, animation, config, variation);

          // Ensure popup is visible after animation
          previewElement.style.opacity = "1";
          previewElement.style.transform = "";
        }
        // For exit animations: show popup first, then hide with animation
        else if (type === "exit") {
          // Ensure popup is visible first
          previewElement.style.opacity = "1";
          previewElement.style.transform = "";
          previewElement.style.animation = "none";

          // Force reflow
          void previewElement.offsetHeight;

          // Apply exit animation
          await AnimationUtils.applyAnimation(previewElement, animation, config, variation);

          // After exit animation, show popup again for next preview
          await new Promise((resolve) => setTimeout(resolve, 200));
          previewElement.style.opacity = "1";
          previewElement.style.transform = "";
          previewElement.style.animation = "none";
        }
        // For hover and attention animations: just play the animation
        else {
          // Reset element to initial state
          previewElement.style.animation = "none";
          previewElement.style.transform = "";
          previewElement.style.opacity = "1";

          // Force reflow
          void previewElement.offsetHeight;

          // Apply animation
          await AnimationUtils.applyAnimation(previewElement, animation, config, variation);

          // Reset after animation completes
          previewElement.style.animation = "";
          previewElement.style.transform = "";
          previewElement.style.opacity = "1";
        }
      } catch (error) {
        console.error("Animation preview failed:", error);
      }
    },
    [previewElement]
  );

  // Detect animation changes and trigger preview with debounce (500ms)
  useEffect(() => {
    const currentAnimations = designConfig.animations;
    const previousAnimations = previousAnimationsRef.current;

    if (!currentAnimations || !previousAnimations) {
      previousAnimationsRef.current = currentAnimations || null;
      return;
    }

    // Clear existing debounce timer
    if (animationDebounceTimerRef.current) {
      clearTimeout(animationDebounceTimerRef.current);
    }

    // Determine which animation type changed
    let changedType: "entrance" | "exit" | "hover" | "attention" | null = null;

    if (
      JSON.stringify(currentAnimations.entrance) !== JSON.stringify(previousAnimations.entrance)
    ) {
      changedType = "entrance";
    } else if (JSON.stringify(currentAnimations.exit) !== JSON.stringify(previousAnimations.exit)) {
      changedType = "exit";
    } else if (
      JSON.stringify(currentAnimations.hover) !== JSON.stringify(previousAnimations.hover)
    ) {
      changedType = "hover";
    } else if (
      JSON.stringify(currentAnimations.attention) !== JSON.stringify(previousAnimations.attention)
    ) {
      changedType = "attention";
    }

    // Trigger preview after debounce if a change was detected
    if (changedType) {
      animationDebounceTimerRef.current = setTimeout(() => {
        triggerAnimationPreview(changedType!, currentAnimations);
      }, 500);
    }

    // Update previous animations ref
    previousAnimationsRef.current = currentAnimations;

    return () => {
      if (animationDebounceTimerRef.current) {
        clearTimeout(animationDebounceTimerRef.current);
      }
    };
  }, [designConfig.animations, triggerAnimationPreview]);

  // Initialize debouncedConfig with designConfig on first render
  useEffect(() => {
    setDebouncedConfig(designConfig);
  }, [designConfig]); // Keep in sync with designConfig

  // Debounce config updates (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedConfig(designConfig);
      onConfigChange(designConfig);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [designConfig, onConfigChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + 1-9 to jump to sections
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const sectionIndex = parseInt(e.key) - 1;
        const sections = Object.keys(openSections);

        if (sections[sectionIndex]) {
          const section = sections[sectionIndex];
          setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

          // Scroll to section
          const element = document.getElementById(`${section}-section`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }

      // Ctrl/Cmd + E to toggle all sections
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        const allOpen = Object.values(openSections).every((v) => v);
        const newSections: Record<string, boolean> = {
          template: !allOpen,
          discount: !allOpen,
          animations: !allOpen,
          advanced: !allOpen,
        };
        // Add all template sections
        templateSections.forEach((section) => {
          newSections[section.key] = !allOpen;
        });
        setOpenSections(newSections);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [openSections, templateSections]);

  const toggleSection = useCallback(
    (section: string) => {
      if (accordionMode) {
        // Accordion mode: close all others, open clicked
        const newSections = Object.keys(openSections).reduce(
          (acc, key) => {
            acc[key as keyof typeof openSections] =
              key === section ? !openSections[section] : false;
            return acc;
          },
          {} as typeof openSections
        );
        setOpenSections(newSections);
      } else {
        // Multi-open mode: toggle clicked section only
        setOpenSections((prev) => ({
          ...prev,
          [section]: !prev[section],
        }));
      }
    },
    [accordionMode, openSections]
  );

  const handleConfigChange = useCallback(
    (updates: Partial<PopupDesignConfig>) => {
      const newConfig = { ...designConfig, ...updates };
      setDesignConfig(newConfig);
      // onConfigChange will be called by useEffect after debounce
    },
    [designConfig]
  );

  // Helper to check if field should be shown based on conditions
  const shouldShowField = (field: ContentFieldDefinition): boolean => {
    if (!field.conditions || field.conditions.length === 0) {
      return true;
    }

    return field.conditions.every((condition) => {
      const fieldValue = designConfig[condition.field as keyof PopupDesignConfig];
      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "not_equals":
          return fieldValue !== condition.value;
        case "contains":
          return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
        default:
          return true;
      }
    });
  };

  // Helper to render a single field
  const renderTemplateField = (field: ContentFieldDefinition) => {
    if (!shouldShowField(field)) {
      return null;
    }

    const value = designConfig[field.id as keyof PopupDesignConfig] ?? field.defaultValue;

    switch (field.type) {
      case "text":
        return (
          <TextField
            key={field.id}
            label={field.label}
            value={String(value || "")}
            onChange={(newValue) => handleConfigChange({ [field.id]: newValue })}
            placeholder={field.placeholder}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
            autoComplete="off"
            maxLength={field.validation?.maxLength}
          />
        );

      case "textarea":
        return (
          <TextField
            key={field.id}
            label={field.label}
            value={String(value || "")}
            onChange={(newValue) => handleConfigChange({ [field.id]: newValue })}
            placeholder={field.placeholder}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
            multiline={4}
            autoComplete="off"
            maxLength={field.validation?.maxLength}
          />
        );

      case "boolean":
        return (
          <Checkbox
            key={field.id}
            label={field.label}
            checked={Boolean(value)}
            onChange={(newValue) => handleConfigChange({ [field.id]: newValue })}
            helpText={field.description}
          />
        );

      case "number":
        return (
          <TextField
            key={field.id}
            label={field.label}
            type="number"
            value={String(value || field.defaultValue || "")}
            onChange={(newValue) => handleConfigChange({ [field.id]: Number(newValue) || 0 })}
            placeholder={field.placeholder}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
            autoComplete="off"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case "select":
        return (
          <Select
            key={field.id}
            label={field.label}
            options={field.options || []}
            value={String(value || field.defaultValue || "")}
            onChange={(newValue) => handleConfigChange({ [field.id]: newValue })}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
          />
        );

      case "color":
        return (
          <div key={field.id} style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              {field.label}
              {field.validation?.required && <span style={{ color: "red" }}> *</span>}
            </label>
            <input
              type="color"
              value={String(value || field.defaultValue || "#000000")}
              onChange={(e) => handleConfigChange({ [field.id]: e.target.value })}
              style={{
                width: "100%",
                height: "40px",
                border: "1px solid #c4cdd5",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            />
            {field.description && (
              <div
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.875rem",
                  color: "#6d7175",
                }}
              >
                {field.description}
              </div>
            )}
          </div>
        );

      case "prize-list": {
        return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {field.label}
              {field.validation?.required && <span style={{ color: "red" }}> *</span>}
            </label>
            {field.description && (
              <Text as="p" variant="bodySm" tone="subdued">
                {field.description}
              </Text>
            )}
            <PrizeListEditor
              value={value as string | PrizeItem[] | undefined}
              onChange={(next: PrizeItem[]) => handleConfigChange({ [field.id]: next })}
            />
          </div>
        );
      }

      case "color-list": {
        return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {field.label}
              {field.validation?.required && <span style={{ color: "red" }}> *</span>}
            </label>
            {field.description && (
              <Text as="p" variant="bodySm" tone="subdued">
                {field.description}
              </Text>
            )}
            <WheelColorEditor
              value={value as string | string[] | undefined}
              onChange={(next: string[]) => handleConfigChange({ [field.id]: next })}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  const SectionHeader = ({
    title,
    section,
  }: {
    title: string;
    section: keyof typeof openSections;
  }) => (
    <Box
      padding="400"
      borderBlockEndWidth="025"
      borderColor="border"
      background="bg-surface-secondary"
    >
      <div
        onClick={() => toggleSection(section)}
        role="button"
        tabIndex={0}
        style={{
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          padding: "8px 0",
          borderRadius: "4px",
          transition: "background-color 0.2s ease",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSection(section);
          }
        }}
        aria-expanded={openSections[section]}
        aria-controls={`${section}-section`}
        aria-label={`${openSections[section] ? "Collapse" : "Expand"} ${title} section`}
      >
        <InlineStack gap="200" blockAlign="center" wrap={false}>
          {/* Left side: Icon + Title */}
          <InlineStack gap="200" blockAlign="center">
            <Icon source={SECTION_ICONS[section as keyof typeof SECTION_ICONS]} tone="base" />
            <Text as="h3" variant="headingMd" fontWeight="semibold">
              {title}
            </Text>
          </InlineStack>

          {/* Spacer to push arrow to extreme right */}
          <div style={{ flex: 1 }}></div>

          {/* Right side: Explicit chevron icon at extreme right */}
          <Icon source={openSections[section] ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
        </InlineStack>
      </div>
    </Box>
  );

  return (
    <div style={{ overflow: "visible", position: "relative" }}>
      <BlockStack gap="400">
        {/* Header with controls */}
        <Box padding="400" borderBlockEndWidth="025" borderColor="border">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h2" variant="headingLg">
                Design Your Popup
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Keyboard shortcuts: ⌘/Ctrl + 1-9 to jump to sections, ⌘/Ctrl + E to expand/collapse
                all
              </Text>
            </BlockStack>

            {/* Collapse/Expand All buttons + Accordion mode */}
            <InlineStack gap="200" blockAlign="center">
              <ButtonGroup>
                <Button
                  size="slim"
                  onClick={() => {
                    const newSections: Record<string, boolean> = {
                      template: false,
                      discount: false,
                      animations: false,
                      advanced: false,
                    };
                    // Add all template sections
                    templateSections.forEach((section) => {
                      newSections[section.key] = false;
                    });
                    setOpenSections(newSections);
                  }}
                >
                  Collapse All
                </Button>
                <Button
                  size="slim"
                  onClick={() => {
                    const newSections: Record<string, boolean> = {
                      template: true,
                      discount: true,
                      animations: true,
                      advanced: true,
                    };
                    // Add all template sections
                    templateSections.forEach((section) => {
                      newSections[section.key] = true;
                    });
                    setOpenSections(newSections);
                  }}
                >
                  Expand All
                </Button>
              </ButtonGroup>

              <Checkbox
                label="Accordion mode"
                checked={accordionMode}
                onChange={setAccordionMode}
                helpText="Only one section open at a time"
              />
            </InlineStack>
          </InlineStack>
        </Box>

        <Layout>
          {/* Left Column - Scrollable Controls (2/3 width) */}
          <Layout.Section>
            <BlockStack gap="400">
              {/* Template Selection Section */}
              <Card padding="0">
                <SectionHeader title="Template Selection" section="template" />
                <Collapsible
                  open={openSections.template}
                  id="template-section"
                  transition={{
                    duration: "200ms",
                    timingFunction: "ease-in-out",
                  }}
                >
                  <Box padding="400">
                    <CampaignTemplateSelector
                      goal={validatedCampaignGoal as CampaignGoal}
                      storeId={storeId}
                      selectedTemplateId={
                        typeof selectedTemplate?.templateId === "string"
                          ? selectedTemplate.templateId
                          : undefined
                      }
                      onSelect={handleCampaignTemplateSelect}
                    />
                  </Box>
                </Collapsible>
              </Card>

              {/* Template-Specific Sections (Dynamic) */}
              {currentTemplateType &&
                templateSections.map((section) => (
                  <Card key={section.key} padding="0">
                    <Box
                      padding="400"
                      borderBlockEndWidth="025"
                      borderColor="border"
                      background="bg-surface-secondary"
                    >
                      <div
                        onClick={() => toggleSection(section.key)}
                        role="button"
                        tabIndex={0}
                        style={{
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 0",
                          borderRadius: "4px",
                          transition: "background-color 0.2s ease",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSection(section.key);
                          }
                        }}
                        aria-expanded={openSections[section.key]}
                        aria-controls={`${section.key}-section`}
                        aria-label={`${openSections[section.key] ? "Collapse" : "Expand"} ${section.title} section`}
                      >
                        <InlineStack gap="200" blockAlign="center" wrap={false}>
                          {/* Left side: Icon + Title */}
                          <InlineStack gap="200" blockAlign="center">
                            <span style={{ fontSize: "20px" }}>{section.icon}</span>
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingMd" fontWeight="semibold">
                                {section.title}
                              </Text>
                              {section.description && (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {section.description}
                                </Text>
                              )}
                            </BlockStack>
                          </InlineStack>

                          {/* Spacer to push badges and arrow to extreme right */}
                          <div style={{ flex: 1 }} />

                          {/* Right side: Badges + Arrow */}
                          <InlineStack gap="200" blockAlign="center">
                            {section.hasAdvancedFields && <Badge tone="info">Advanced</Badge>}
                            <Icon
                              source={openSections[section.key] ? ChevronUpIcon : ChevronDownIcon}
                              tone="base"
                            />
                          </InlineStack>
                        </InlineStack>
                      </div>
                    </Box>
                    <Collapsible
                      open={openSections[section.key] ?? section.defaultOpen}
                      id={`${section.key}-section`}
                      transition={{
                        duration: "200ms",
                        timingFunction: "ease-in-out",
                      }}
                    >
                      <Box padding="400">
                        <FormLayout>
                          {section.fields.map((field) => renderTemplateField(field))}
                        </FormLayout>
                      </Box>
                    </Collapsible>
                  </Card>
                ))}

              {/* Discount Settings Section - Show for applicable templates/goals */}
              {shouldShowDiscountSection() && (
                <Card padding="0">
                  <Box
                    padding="400"
                    borderBlockEndWidth="025"
                    borderColor="border"
                    background="bg-surface-secondary"
                  >
                    <div
                      onClick={() => toggleSection("discount")}
                      role="button"
                      tabIndex={0}
                      style={{
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 0",
                        borderRadius: "4px",
                        transition: "background-color 0.2s ease",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSection("discount");
                        }
                      }}
                      aria-expanded={openSections.discount}
                      aria-controls="discount-section"
                      aria-label={`${openSections.discount ? "Collapse" : "Expand"} Discount Settings section`}
                    >
                      <InlineStack gap="200" blockAlign="center" wrap={false}>
                        {/* Left side: Icon + Title */}
                        <InlineStack gap="200" blockAlign="center">
                          <span style={{ fontSize: "20px" }}>💰</span>
                          <BlockStack gap="100">
                            <Text as="h3" variant="headingMd" fontWeight="semibold">
                              Discount Settings
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Configure discount incentives and delivery
                            </Text>
                          </BlockStack>
                        </InlineStack>

                        {/* Spacer to push arrow to extreme right */}
                        <div style={{ flex: 1 }} />

                        {/* Right side: Arrow */}
                        <InlineStack gap="200" blockAlign="center">
                          <Icon
                            source={openSections.discount ? ChevronUpIcon : ChevronDownIcon}
                            tone="base"
                          />
                        </InlineStack>
                      </InlineStack>
                    </div>
                  </Box>
                  <Collapsible
                    open={openSections.discount ?? true}
                    id="discount-section"
                    transition={{
                      duration: "200ms",
                      timingFunction: "ease-in-out",
                    }}
                  >
                    <Box padding="400">
                      <DiscountSection
                        goal={campaignGoal}
                        discountConfig={discountConfig}
                        onConfigChange={onDiscountChange || (() => {})}
                      />
                    </Box>
                  </Collapsible>
                </Card>
              )}

              {/* Animations Section */}
              <Card padding="0">
                <SectionHeader title="Animations" section="animations" />
                <Collapsible
                  open={openSections.animations}
                  id="animations-section"
                  transition={{
                    duration: "200ms",
                    timingFunction: "ease-in-out",
                  }}
                >
                  <Box padding="400">
                    <Text as="p" tone="subdued">
                      Animation controls coming soon. The AnimationControlPanel component needs to
                      be created.
                    </Text>
                    {/* TODO: Uncomment when AnimationControlPanel is created
                    <AnimationControlPanel
                      settings={designConfig.animations || defaultAnimations}
                      onSettingsChange={(settings) =>
                        handleConfigChange({ animations: settings })
                      }
                      previewElement={previewElement}
                      onPreview={(type) => {
                        // Trigger animation preview when user clicks preview button
                        if (designConfig.animations) {
                          triggerAnimationPreview(
                            type,
                            designConfig.animations,
                          );
                        }
                      }}
                    />
                    */}
                  </Box>
                </Collapsible>
              </Card>

              {/* Developer Settings Section (renamed from Advanced) */}
              <Card padding="0">
                <SectionHeader title="Developer Settings" section="advanced" />
                <Collapsible
                  open={openSections.advanced}
                  id="advanced-section"
                  transition={{
                    duration: "200ms",
                    timingFunction: "ease-in-out",
                  }}
                >
                  <Box padding="400">
                    <BlockStack gap="400">
                      <Text as="h4" variant="headingSm" fontWeight="semibold">
                        Custom CSS
                      </Text>
                      <CustomCSSEditor
                        value={designConfig.customCSS || ""}
                        onChange={(value) => handleConfigChange({ customCSS: value })}
                        onPreview={() => {}}
                        disabled={isLoading}
                      />
                      <Text as="h4" variant="headingSm" fontWeight="semibold">
                        Mobile Optimization
                      </Text>
                      <Text as="p" tone="subdued">
                        Mobile optimization controls coming soon. The MobileOptimizationPanel
                        component needs to be created.
                      </Text>
                      {/* TODO: Uncomment when MobileOptimizationPanel is created
                      <MobileOptimizationPanel
                        config={
                          designConfig.mobileOptimization || {
                            enabled: false,
                            touchOptimization: {
                              enabled: true,
                              minTouchTargetSize: 44,
                              touchFeedback: true,
                              hapticFeedback: false,
                              doubleTapPrevention: true,
                            },
                            gestureControls: {
                              enabled: false,
                              swipeToClose: false,
                              swipeDirection: "down",
                              pinchToZoom: false,
                              longPressActions: false,
                              swipeThreshold: 50,
                            },
                            responsiveDesign: {
                              enabled: true,
                              mobileBreakpoint: 768,
                              tabletBreakpoint: 1024,
                              adaptiveLayout: true,
                              scaleFactor: 1,
                              fontSizeAdjustment: 100,
                            },
                            mobileAnimations: {
                              enabled: true,
                              reducedMotion: false,
                              fasterAnimations: true,
                              touchAnimations: true,
                              animationDuration: 200,
                            },
                            performanceOptimization: {
                              enabled: true,
                              lazyLoading: true,
                              imageOptimization: true,
                              preloadCriticalAssets: false,
                              minimizeReflows: true,
                            },
                            uxEnhancements: {
                              enabled: false,
                              fullscreenMode: false,
                              statusBarHandling: false,
                              safeAreaInsets: true,
                              orientationLock: false,
                              preventZoom: false,
                            },
                          }
                        }
                        onChange={(config) =>
                          handleConfigChange({ mobileOptimization: config })
                        }
                        disabled={isLoading}
                      />
                      */}
                    </BlockStack>
                  </Box>
                </Collapsible>
              </Card>
            </BlockStack>
          </Layout.Section>

          {/* Right Column - Live Preview (always visible) */}
          <Layout.Section variant="oneHalf">
            <div data-affix-boundary style={{ position: "relative", alignSelf: "flex-start" }}>
              <Affix disableBelowWidth={768} debug={true}>
                <div className={styles.stickyPreviewScrollable} data-affix-scrollable>
                  <LivePreviewPanel
                    templateType={currentTemplateType}
                    config={debouncedConfig as unknown as Record<string, unknown>}
                    designConfig={{}}
                    onPreviewElementReady={setPreviewElement}
                    shopDomain={shopDomain}
                    campaignId={campaignId}
                  />
                </div>
              </Affix>
            </div>
          </Layout.Section>
        </Layout>

        {/* Template Change Warning Modal */}
        <Modal
          open={showTemplateChangeWarning}
          onClose={handleCancelTemplateChange}
          title="Change Template?"
          primaryAction={{
            content: "Change Template",
            onAction: handleConfirmTemplateChange,
            destructive: true,
          }}
          secondaryActions={[
            {
              content: "Keep Current Template",
              onAction: handleCancelTemplateChange,
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p" variant="bodyMd">
                Changing the template will reset some of your customizations to match the new
                template&apos;s defaults.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                This includes design settings, content structure, and some template-specific
                configurations. Your content (headlines, descriptions, etc.) will be preserved.
              </Text>
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Are you sure you want to change to the new template?
              </Text>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </BlockStack>
    </div>
  );
};

export default PopupDesignEditorV2;
