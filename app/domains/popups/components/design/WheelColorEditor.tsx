// React import not needed with JSX transform
import { BlockStack, Button, ButtonGroup, Text, InlineStack, Banner } from "@shopify/polaris";

export interface WheelColorEditorProps {
  value: string[] | string | undefined;
  onChange: (colors: string[]) => void;
}

export function WheelColorEditor({ value, onChange }: WheelColorEditorProps) {
  // Parse value - can be array of colors or comma-separated string
  const colors: string[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

  // Default colors if empty
  const displayColors =
    colors.length > 0 ? colors : ["#FF6B6B", "#FFD166", "#06D6A0", "#118AB2", "#8338EC", "#EF476F"];

  const updateColor = (index: number, newColor: string) => {
    const updated = [...displayColors];
    updated[index] = newColor;
    onChange(updated);
  };

  const addColor = () => {
    const newColors = [...displayColors, "#000000"];
    onChange(newColors);
  };

  const removeColor = (index: number) => {
    if (displayColors.length <= 2) {
      return; // Keep at least 2 colors
    }
    const updated = displayColors.filter((_, i) => i !== index);
    onChange(updated);
  };

  const resetToDefaults = () => {
    onChange(["#FF6B6B", "#FFD166", "#06D6A0", "#118AB2", "#8338EC", "#EF476F"]);
  };

  return (
    <BlockStack gap="300">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="p" variant="bodySm" tone="subdued">
          Colors will repeat to match the number of prizes
        </Text>
        <Button size="slim" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </InlineStack>

      {displayColors.length < 2 && (
        <Banner tone="warning">
          <Text as="p" variant="bodySm">
            At least 2 colors are required for the wheel
          </Text>
        </Banner>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "12px",
        }}
      >
        {displayColors.map((color, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #E1E3E5",
              borderRadius: "8px",
              padding: "12px",
              position: "relative",
            }}
          >
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" fontWeight="semibold">
                  Color {index + 1}
                </Text>
                {displayColors.length > 2 && (
                  <Button size="micro" tone="critical" onClick={() => removeColor(index)}>
                    ×
                  </Button>
                )}
              </InlineStack>

              {/* Color Preview */}
              <div
                style={{
                  width: "100%",
                  height: "60px",
                  backgroundColor: color,
                  borderRadius: "4px",
                  border: "1px solid #E1E3E5",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => {
                  const input = document.getElementById(
                    `color-picker-${index}`
                  ) as HTMLInputElement;
                  input?.click();
                }}
              >
                {/* Hidden color input */}
                <input
                  id={`color-picker-${index}`}
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 0,
                    height: 0,
                  }}
                />
              </div>

              {/* Hex Value Display */}
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow typing hex values
                  if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                    updateColor(index, val);
                  }
                }}
                placeholder="#000000"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #c4cdd5",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  textAlign: "center",
                }}
              />
            </BlockStack>
          </div>
        ))}
      </div>

      <ButtonGroup>
        <Button onClick={addColor}>Add Color</Button>
      </ButtonGroup>

      {/* Preview of color pattern */}
      <div>
        <Text as="p" variant="bodySm" fontWeight="semibold">
          Preview Pattern
        </Text>
        <div
          style={{
            display: "flex",
            height: "40px",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #E1E3E5",
            marginTop: "8px",
          }}
        >
          {displayColors.map((color, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                backgroundColor: color,
              }}
              title={color}
            />
          ))}
        </div>
      </div>
    </BlockStack>
  );
}
