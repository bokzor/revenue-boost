/**
 * TemplatePreview Component
 *
 * Renders the appropriate template component based on templateType.
 * Uses actual template components for accurate WYSIWYG preview.
 */

import React, {
  useCallback,
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

import { TemplateTypeEnum } from "~/lib/template-types.enum";
import { getTemplatePreviewEntry } from "./template-preview-registry";

export interface TemplatePreviewProps {
  templateType?: string;
  config: Record<string, any>;
  designConfig: Record<string, any>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
}

export interface TemplatePreviewRef {
  getPreviewElement: () => HTMLElement | null;
}

const TemplatePreviewComponent = forwardRef<
  TemplatePreviewRef,
  TemplatePreviewProps
>(({ templateType, config, designConfig, onPreviewElementReady }, ref) => {
  // Always call all hooks in the same order - no early returns before hooks!
  const previewElementRef = useRef<HTMLElement | null>(null);
  const renderCount = useRef(0);

  // Increment render count for debugging
  renderCount.current += 1;

  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      getPreviewElement: () => previewElementRef.current,
    }),
    [],
  );

  // Callback to set the preview element ref
  const setPreviewElementRef = useCallback(
    (element: HTMLElement | null) => {
      previewElementRef.current = element;
      onPreviewElementReady?.(element);
    },
    [onPreviewElementReady],
  );

  // Memoize merged config to prevent re-renders with more stable dependencies
  const mergedConfig: Record<string, any> = useMemo(() => {
    if (!templateType) {
      return { ...config, ...designConfig };
    }

    // For newsletter templates, ensure discount config is properly merged
    const baseConfig = {
      ...config,
      ...designConfig,
      // Ensure popup is visible in preview
      isVisible: true,
      // Enable preview mode to prevent fixed positioning
      previewMode: true,
    };

    // If this is a newsletter template, merge discount configuration
    if (templateType.includes("newsletter")) {
      const result = {
        ...baseConfig,
        // Enable discount by default for newsletter templates
        discountEnabled:
          config.discountEnabled ?? designConfig.discountEnabled ?? true,
        // Provide discount code for template interpolation
        discountCode:
          config.discountCode || designConfig.discountCode || "WELCOME10",
        discountValue:
          config.discountValue ??
          designConfig.discountValue ??
          config.discountPercentage ??
          10,
        discountType:
          config.discountType || designConfig.discountType || "percentage",
      };
      return result;
    }

    return baseConfig;
  }, [config, designConfig, templateType]);

  // Create reliable inline SVG placeholder
  const createPlaceholderSVG = useCallback(
    (width = 150, height = 150, text = "Product") => {
      const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8f9fa"/>
      <rect x="${width * 0.2}" y="${height * 0.15}" width="${width * 0.6}" height="${height * 0.5}" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>
      <rect x="${width * 0.25}" y="${height * 0.2}" width="${width * 0.5}" height="${height * 0.4}" fill="#ffffff" stroke="#dee2e6" stroke-width="1"/>
      <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${width * 0.08}" fill="#6c757d"/>
      <path d="M${width * 0.45} ${height * 0.42} L${width * 0.48} ${height * 0.45} L${width * 0.55} ${height * 0.38}" stroke="#ffffff" stroke-width="2" fill="none"/>
      <text x="${width * 0.5}" y="${height * 0.75}" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="${Math.max(10, width * 0.08)}">
        ${text}
      </text>
      <text x="${width * 0.5}" y="${height * 0.85}" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="${Math.max(8, width * 0.06)}">
        Preview
      </text>
    </svg>`;

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    },
    [],
  );

  // Memoize mock products to prevent re-renders with reliable image URLs
  const mockProducts = useMemo(
    () => [
      {
        id: "1",
        title: "Stylish T-Shirt",
        price: "29.99",
        compareAtPrice: "39.99",
        imageUrl: createPlaceholderSVG(150, 150, "T-Shirt"),
        variantId: "variant-1",
        handle: "product-1",
      },
      {
        id: "2",
        title: "Cozy Sweater",
        price: "34.99",
        compareAtPrice: "44.99",
        imageUrl: createPlaceholderSVG(150, 150, "Sweater"),
        variantId: "variant-2",
        handle: "product-2",
      },
      {
        id: "3",
        title: "Classic Jeans",
        price: "24.99",
        imageUrl: createPlaceholderSVG(150, 150, "Jeans"),
        variantId: "variant-3",
        handle: "product-3",
      },
    ],
    [createPlaceholderSVG],
  );

  // Note: upsellConfig removed - now created inline in each template case

  // Preview container wrapper - creates positioning context for popups
  // Uses relative positioning to stay within the content area (not covering device chrome)
  // No backdrop here - the BasePopup component handles its own backdrop
  const PreviewContainer: React.FC<{ children: React.ReactNode }> = useCallback(
    ({ children }) => (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "100%",
        }}
      >
        {children}
      </div>
    ),
    [],
  );

  // Now handle the conditional rendering AFTER all hooks have been called
  if (!templateType) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
          backgroundColor: "#F6F6F7",
          color: "#5C5F62",
          fontSize: "14px",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <div style={{ fontWeight: 500, marginBottom: "8px" }}>
            No Template Selected
          </div>
          <div style={{ fontSize: "13px", color: "#8C9196" }}>
            Select a template to see a live preview
          </div>
        </div>
      </div>
    );
  }

  // Use template preview registry for rendering
  const previewEntry = getTemplatePreviewEntry(templateType);

  if (!previewEntry) {
    console.warn(
      `Unknown template type "${templateType}" in preview. Using newsletter fallback.`,
    );
    // Fallback to newsletter
    const fallbackEntry = getTemplatePreviewEntry(TemplateTypeEnum.NEWSLETTER);
    if (fallbackEntry) {
      const PreviewComponent = fallbackEntry.component;
      const componentConfig = fallbackEntry.buildConfig(mergedConfig, designConfig);

      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <PreviewComponent
              config={componentConfig}
              isVisible={true}
              onClose={() => {}}
            />
          </div>
        </PreviewContainer>
      );
    }
    return null;
  }

  // Render the appropriate component with its config
  const PreviewComponent = previewEntry.component;
  const componentConfig = previewEntry.buildConfig(mergedConfig, designConfig);

  return (
    <PreviewContainer>
      <div
        ref={setPreviewElementRef}
        data-popup-preview
        style={{ display: "contents" }}
      >
        <PreviewComponent
          config={componentConfig}
          isVisible={true}
          onClose={() => {}}
        />
      </div>
    </PreviewContainer>
  );
});

// Helper function for deep comparison with stability
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return obj1 === obj2;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object") return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

// Add display name to the component
TemplatePreviewComponent.displayName = "TemplatePreviewComponent";

// Export memoized component to prevent unnecessary re-renders
export const TemplatePreview = memo(
  TemplatePreviewComponent,
  (prevProps, nextProps) => {
    // Only re-render if template type changes or if configs have actually changed content
    if (prevProps.templateType !== nextProps.templateType) {
      return false; // Re-render
    }

    // Use deep equality check which is more reliable than JSON.stringify
    const configEqual = deepEqual(prevProps.config, nextProps.config);
    const designConfigEqual = deepEqual(
      prevProps.designConfig,
      nextProps.designConfig,
    );

    // Return true if configs are the same (no re-render needed)
    const shouldSkipRender = configEqual && designConfigEqual;

    // Debug log for re-render decisions (throttled for upsell templates)
    if (
      !shouldSkipRender &&
      (nextProps.templateType?.includes("upsell") ||
        nextProps.templateType?.includes("cart") ||
        nextProps.templateType === "product-recommendation")
    ) {
      console.log(
        "🔄 [TemplatePreview] Re-render triggered for",
        nextProps.templateType,
        {
          configEqual,
          designConfigEqual,
          prevConfigKeys: Object.keys(prevProps.config || {}),
          nextConfigKeys: Object.keys(nextProps.config || {}),
          prevDesignKeys: Object.keys(prevProps.designConfig || {}),
          nextDesignKeys: Object.keys(nextProps.designConfig || {}),
        },
      );
    }

    return shouldSkipRender;
  },
);

TemplatePreview.displayName = "TemplatePreview";
