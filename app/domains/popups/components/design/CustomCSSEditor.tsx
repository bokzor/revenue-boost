import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import { CustomCssSchema, CUSTOM_CSS_MAX_LENGTH } from "~/lib/css-guards";
import {
  CSS_VARIABLES,
  getCustomCssConfig,
  getCssSnippets,
  type CssSnippet,
} from "./custom-css-config";

export interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
  onPreview?: (css: string) => void;
  disabled?: boolean;
  templateType?: string;
}

interface CSSValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

export const CustomCSSEditor: React.FC<CustomCSSEditorProps> = ({
  value,
  onChange,
  onPreview,
  disabled = false,
  templateType,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<CSSValidationError[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supportsCSSStyleSheet = typeof CSSStyleSheet !== "undefined";
  const { sharedHooks, templateHooks } = useMemo(
    () => getCustomCssConfig(templateType),
    [templateType]
  );
  const { sharedSnippets, templateSnippets } = useMemo(
    () => getCssSnippets(templateType),
    [templateType]
  );
  const snippetTarget = useMemo(
    () => templateHooks[0]?.selector || sharedHooks[0]?.selector || '[data-splitpop="true"]',
    [sharedHooks, templateHooks]
  );

  const knownProperties = useMemo(
    () =>
      new Set([
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
        "gap",
        "grid-template-columns",
        "align-items",
        "justify-content",
        "flex-direction",
        "flex",
        "flex-wrap",
        "backdrop-filter",
        "filter",
        "cursor",
        "background-image",
        "background-position",
        "background-size",
        "background-repeat",
        "border-color",
        "border-width",
        "border-style",
        "object-fit",
        "object-position",
        "outline",
        "outline-color",
        "outline-offset",
        "outline-width",
        "text-decoration",
        "text-transform",
        "font-style",
        "max-width",
        "min-width",
        "max-height",
        "min-height",
        "overflow",
        "overflow-y",
        "overflow-x",
      ]),
    []
  );

  // CSS Validation
  const validateCSS = useCallback(
    (css: string): CSSValidationError[] => {
      const errors: CSSValidationError[] = [];
      const lines = css.split("\n");

      // Enforce shared schema rules (length + basic sanitization)
      const schemaResult = CustomCssSchema.safeParse(css);
      if (!schemaResult.success) {
        schemaResult.error.issues.forEach((issue) => {
          errors.push({
            line: 1,
            column: 1,
            message: issue.message,
            severity: "error",
          });
        });
      }

      // Braces balance
      let braceBalance = 0;
      lines.forEach((line, index) => {
        for (const char of line) {
          if (char === "{") braceBalance += 1;
          if (char === "}") braceBalance -= 1;
          if (braceBalance < 0) {
            errors.push({
              line: index + 1,
              column: line.indexOf("}") + 1 || 1,
              message: "Unmatched closing brace",
              severity: "error",
            });
            braceBalance = 0;
          }
        }
      });

      if (braceBalance > 0) {
        errors.push({
          line: lines.length,
          column: lines[lines.length - 1]?.length || 1,
          message: "Missing closing brace",
          severity: "error",
        });
      }

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

          if (!knownProperties.has(property) && !property.startsWith("--")) {
            errors.push({
              line: lineNumber,
              column: propertyMatch.index || 0,
              message: `Unknown property: ${property}`,
              severity: "warning",
            });
          }
        }
      });

      // Browser-level validation (catches fatal syntax)
      if (supportsCSSStyleSheet && css.trim() && !errors.some((e) => e.severity === "error")) {
        try {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(css);
        } catch (error) {
          errors.push({
            line: 1,
            column: 1,
            message:
              error instanceof Error
                ? `CSS parse error: ${error.message.replace("Failed to parse the rule.", "").trim()}`
                : "CSS parse error",
            severity: "error",
          });
        }
      }

      return errors;
    },
    [knownProperties, supportsCSSStyleSheet]
  );

  // Handle CSS change
  const handleCSSChange = useCallback(
    (newCSS: string) => {
      onChange(newCSS);
      const errors = validateCSS(newCSS);
      setValidationErrors(errors);
    },
    [onChange, validateCSS]
  );

  useEffect(() => {
    setValidationErrors(value ? validateCSS(value) : []);
  }, [validateCSS, value]);

  // Handle snippet insertion
  const handleSnippetInsert = useCallback(
    (snippet: CssSnippet) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const snippetCss = snippet.css.replace(/__TARGET__/g, snippetTarget);
      const newValue =
        value.substring(0, start) + "\n\n" + snippetCss + "\n\n" + value.substring(end);

      handleCSSChange(newValue);

      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + snippetCss.length + 4,
          start + snippetCss.length + 4
        );
      }, 0);
    },
    [snippetTarget, value, handleCSSChange]
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
      .replace(/([a-zA-Z-]+)(\s*:)/g, '<span style="color: #0066cc;">$1</span>$2')
      .replace(/(\/\*.*?\*\/)/g, '<span style="color: #008000;">$1</span>')
      .replace(/({|})/g, '<span style="color: #ff6600;">$1</span>');
  }, []);

  const errorCount = validationErrors.filter((e) => e.severity === "error").length;
  const warningCount = validationErrors.filter((e) => e.severity === "warning").length;

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
              <Badge tone="info">{`${value.length.toLocaleString()} / ${CUSTOM_CSS_MAX_LENGTH.toLocaleString()} chars`}</Badge>

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

              <Button icon={ResetIcon} onClick={handleReset} disabled={disabled || !value.trim()}>
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

          {/* CSS hooks & variables */}
          <Card background="bg-surface-secondary">
            <Box padding="300">
              <BlockStack gap="300">
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  Available hooks
                </Text>

                <BlockStack gap="150">
                  <Text as="span" tone="subdued" variant="bodySm">
                    Shared shell (applies to all popups)
                  </Text>
                  {sharedHooks.map((hook) => (
                    <Box
                      key={hook.selector}
                      padding="150"
                      background="bg-surface-secondary"
                      borderWidth="025"
                      borderColor="border"
                      borderRadius="200"
                    >
                      <InlineStack align="space-between" gap="150">
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          Shared
                        </Text>
                        <Badge tone="info">{hook.selector}</Badge>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {hook.description}
                      </Text>
                    </Box>
                  ))}
                </BlockStack>

                {templateHooks.length > 0 && (
                  <BlockStack gap="150">
                    <Text as="span" tone="subdued" variant="bodySm">
                      This template
                    </Text>
                    {templateHooks.map((hook) => (
                      <Box
                        key={hook.selector}
                        padding="150"
                        background="bg-surface-secondary"
                        borderWidth="025"
                        borderColor="border"
                        borderRadius="200"
                      >
                        <InlineStack align="space-between" gap="150">
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            Template
                          </Text>
                          <Badge tone="info">{hook.selector}</Badge>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {hook.description}
                        </Text>
                      </Box>
                    ))}
                  </BlockStack>
                )}

                <Box padding="150" borderWidth="025" borderColor="border" borderRadius="200">
                  <BlockStack gap="150">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        Design tokens
                      </Text>
                      <Badge tone="info">CSS variables</Badge>
                    </InlineStack>
                    <InlineStack wrap gap="150">
                      {CSS_VARIABLES.map((variable) => (
                        <Box
                          key={variable.name}
                          paddingInlineStart="150"
                          paddingInlineEnd="150"
                          paddingBlockStart="100"
                          paddingBlockEnd="100"
                          background="bg-surface"
                          borderWidth="025"
                          borderColor="border"
                          borderRadius="150"
                        >
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            {variable.name}
                          </Text>
                          <Text as="p" variant="bodyXs" tone="subdued">
                            {variable.description}
                          </Text>
                        </Box>
                      ))}
                    </InlineStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Box>
          </Card>

          {/* CSS Snippets */}
          <Card background="bg-surface-secondary">
            <Box padding="300">
              <BlockStack gap="300">
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  CSS Snippets
                </Text>

                <Text as="span" tone="subdued" variant="bodySm">
                  Shared
                </Text>
                <InlineStack gap="200" wrap>
                  {sharedSnippets.map((snippet) => (
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

                {templateSnippets.length > 0 && (
                  <>
                    <Text as="span" tone="subdued" variant="bodySm">
                      This template
                    </Text>
                    <InlineStack gap="200" wrap>
                      {templateSnippets.map((snippet) => (
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
                  </>
                )}
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
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: "14px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        backgroundColor: "#f8f9fa",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #e1e3e5",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightCSS(value || "/* No custom CSS added yet */"),
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
                  maxLength={CUSTOM_CSS_MAX_LENGTH}
                  spellCheck={false}
                  placeholder="/* Add your custom CSS here */&#10;[data-popup-card] {&#10;  /* Your styles */&#10;}"
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
              <strong>Safety Notice:</strong> Custom CSS is applied with limited scope to prevent
              breaking the popup layout. Styles are automatically prefixed and validated for safety.
            </Text>
          </Banner>
        </BlockStack>
      </Box>
    </Card>
  );
};
