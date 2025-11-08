import React, { useState, useCallback, useRef } from "react";
import {
  Card,
  Text,
  Box,
  Button,
  Banner,
  Badge,
  Tooltip,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { ViewIcon, ResetIcon } from "@shopify/polaris-icons";

export interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
  onPreview?: (css: string) => void;
  disabled?: boolean;
}

interface CSSValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

interface CSSSnippet {
  id: string;
  name: string;
  description: string;
  css: string;
  category: "layout" | "animation" | "styling" | "responsive";
}

const CSS_SNIPPETS: CSSSnippet[] = [
  {
    id: "rounded-corners",
    name: "Rounded Corners",
    description: "Add rounded corners to popup",
    css: ".popup-container {\n  border-radius: 12px;\n  overflow: hidden;\n}",
    category: "styling",
  },
  {
    id: "shadow-effect",
    name: "Drop Shadow",
    description: "Add elegant drop shadow",
    css: ".popup-container {\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);\n}",
    category: "styling",
  },
  {
    id: "gradient-background",
    name: "Gradient Background",
    description: "Beautiful gradient background",
    css: ".popup-container {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}",
    category: "styling",
  },
  {
    id: "pulse-animation",
    name: "Pulse Animation",
    description: "Subtle pulse effect for buttons",
    css: ".popup-button {\n  animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n  0% { transform: scale(1); }\n  50% { transform: scale(1.05); }\n  100% { transform: scale(1); }\n}",
    category: "animation",
  },
  {
    id: "mobile-responsive",
    name: "Mobile Responsive",
    description: "Mobile-optimized styles",
    css: "@media (max-width: 768px) {\n  .popup-container {\n    width: 95vw !important;\n    margin: 10px;\n    border-radius: 8px;\n  }\n}",
    category: "responsive",
  },
  {
    id: "custom-fonts",
    name: "Custom Typography",
    description: "Enhanced typography styles",
    css: '.popup-title {\n  font-family: "Helvetica Neue", sans-serif;\n  font-weight: 700;\n  letter-spacing: -0.5px;\n}\n\n.popup-text {\n  line-height: 1.6;\n  font-size: 16px;\n}',
    category: "styling",
  },
];

export const CustomCSSEditor: React.FC<CustomCSSEditorProps> = ({
  value,
  onChange,
  onPreview,
  disabled = false,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    CSSValidationError[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // CSS Validation
  const validateCSS = useCallback((css: string): CSSValidationError[] => {
    const errors: CSSValidationError[] = [];
    const lines = css.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for missing semicolons (basic check)
      if (
        line.includes(":") &&
        !line.includes(";") &&
        !line.includes("{") &&
        !line.includes("}") &&
        line.trim() !== ""
      ) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          severity: "warning",
        });
      }

      // Check for invalid property names (basic check)
      const propertyMatch = line.match(/^\s*([a-zA-Z-]+)\s*:/);
      if (propertyMatch) {
        const property = propertyMatch[1];
        // List of common CSS properties for basic validation
        const validProperties = [
          "color",
          "background",
          "background-color",
          "border",
          "border-radius",
          "margin",
          "padding",
          "width",
          "height",
          "font-size",
          "font-family",
          "font-weight",
          "text-align",
          "display",
          "position",
          "top",
          "left",
          "right",
          "bottom",
          "z-index",
          "opacity",
          "transform",
          "transition",
          "animation",
          "box-shadow",
          "text-shadow",
          "line-height",
          "letter-spacing",
        ];

        if (!validProperties.includes(property) && !property.startsWith("--")) {
          errors.push({
            line: lineNumber,
            column: propertyMatch.index || 0,
            message: `Unknown property: ${property}`,
            severity: "warning",
          });
        }
      }
    });

    return errors;
  }, []);

  // Handle CSS change
  const handleCSSChange = useCallback(
    (newCSS: string) => {
      onChange(newCSS);
      const errors = validateCSS(newCSS);
      setValidationErrors(errors);
    },
    [onChange, validateCSS],
  );

  // Handle snippet insertion
  const handleSnippetInsert = useCallback(
    (snippet: CSSSnippet) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        value.substring(0, start) +
        "\n\n" +
        snippet.css +
        "\n\n" +
        value.substring(end);

      handleCSSChange(newValue);

      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + snippet.css.length + 4,
          start + snippet.css.length + 4,
        );
      }, 0);
    },
    [value, handleCSSChange],
  );

  // Handle preview toggle
  const handlePreviewToggle = useCallback(() => {
    if (!isPreviewMode && onPreview) {
      onPreview(value);
    }
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode, onPreview, value]);

  // Handle reset
  const handleReset = useCallback(() => {
    handleCSSChange("");
  }, [handleCSSChange]);

  // Syntax highlighting (basic)
  const highlightCSS = useCallback((css: string) => {
    return css
      .replace(
        /([a-zA-Z-]+)(\s*:)/g,
        '<span style="color: #0066cc;">$1</span>$2',
      )
      .replace(/(\/\*.*?\*\/)/g, '<span style="color: #008000;">$1</span>')
      .replace(/({|})/g, '<span style="color: #ff6600;">$1</span>');
  }, []);

  const errorCount = validationErrors.filter(
    (e) => e.severity === "error",
  ).length;
  const warningCount = validationErrors.filter(
    (e) => e.severity === "warning",
  ).length;

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between">
            <BlockStack gap="100">
              <Text as="h3" variant="headingMd">
                Custom CSS Editor
              </Text>
              <Text as="span" variant="bodySm">
                Add custom styles to enhance your popup appearance
              </Text>
            </BlockStack>

            <InlineStack gap="200">
              {validationErrors.length > 0 && (
                <InlineStack gap="100">
                  {errorCount > 0 && (
                    <Badge tone="critical">{`${String(errorCount)} errors`}</Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge tone="warning">{`${String(warningCount)} warnings`}</Badge>
                  )}
                </InlineStack>
              )}

              <Button
                icon={ViewIcon}
                onClick={handlePreviewToggle}
                pressed={isPreviewMode}
                disabled={disabled}
              >
                {isPreviewMode ? "Edit" : "Preview"}
              </Button>

              <Button
                icon={ResetIcon}
                onClick={handleReset}
                disabled={disabled || !value.trim()}
              >
                Reset
              </Button>
            </InlineStack>
          </InlineStack>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Banner
              tone={errorCount > 0 ? "critical" : "warning"}
              title={`${validationErrors.length} CSS ${validationErrors.length === 1 ? "issue" : "issues"} found`}
            >
              <BlockStack gap="100">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <Text as="span" key={index} variant="bodySm">
                    Line {error.line}: {error.message}
                  </Text>
                ))}
                {validationErrors.length > 5 && (
                  <Text as="span" variant="bodySm">
                    ... and {validationErrors.length - 5} more
                  </Text>
                )}
              </BlockStack>
            </Banner>
          )}

          {/* CSS Snippets */}
          <Card background="bg-surface-secondary">
            <Box padding="300">
              <BlockStack gap="300">
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  CSS Snippets
                </Text>

                <InlineStack gap="200" wrap>
                  {CSS_SNIPPETS.map((snippet: any) => (
                    <Tooltip key={snippet.id} content={snippet.description}>
                      <Button
                        size="micro"
                        onClick={() => handleSnippetInsert(snippet)}
                        disabled={disabled}
                      >
                        {snippet.name}
                      </Button>
                    </Tooltip>
                  ))}
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>

          {/* CSS Editor */}
          <Box>
            {isPreviewMode ? (
              <Card background="bg-surface-secondary">
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      CSS Preview
                    </Text>
                    <div
                      style={{
                        fontFamily:
                          'Monaco, Consolas, "Courier New", monospace',
                        fontSize: "14px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        backgroundColor: "#f8f9fa",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #e1e3e5",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightCSS(
                          value || "/* No custom CSS added yet */",
                        ),
                      }}
                    />
                  </BlockStack>
                </Box>
              </Card>
            ) : (
              <Box>
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => handleCSSChange(e.target.value)}
                  disabled={disabled}
                  placeholder="/* Add your custom CSS here */&#10;.popup-container {&#10;  /* Your styles */&#10;}"
                  style={{
                    width: "100%",
                    minHeight: "300px",
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    fontSize: "14px",
                    lineHeight: "1.5",
                    padding: "12px",
                    border: "1px solid #c9cccf",
                    borderRadius: "6px",
                    backgroundColor: disabled ? "#f6f6f7" : "#ffffff",
                    resize: "vertical",
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Safety Notice */}
          <Banner tone="info">
            <Text as="span" variant="bodySm">
              <strong>Safety Notice:</strong> Custom CSS is applied with limited
              scope to prevent breaking the popup layout. Styles are
              automatically prefixed and validated for safety.
            </Text>
          </Banner>
        </BlockStack>
      </Box>
    </Card>
  );
};
