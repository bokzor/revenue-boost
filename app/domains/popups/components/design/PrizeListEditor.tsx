// React import not needed with JSX transform
import {
  BlockStack,
  Button,
  ButtonGroup,
  Text,
  TextField,
  InlineStack,
  Banner,
  Select,
  Box,
} from "@shopify/polaris";

export type DiscountType =
  | "none"
  | "percentage"
  | "fixed_amount"
  | "free_shipping"
  | "custom_code";

export interface PrizeItem {
  id: string;
  label: string;
  probability: number; // percentage, must sum to 100

  // New discount configuration
  discountType?: DiscountType;
  discountValue?: number; // For percentage or fixed_amount
  discountCode?: string; // For custom_code or legacy support

  // Legacy fields (for backward compatibility)
  discountPercentage?: number;
}

export function PrizeListEditor({
  value,
  onChange,
}: {
  value: PrizeItem[] | string | undefined;
  onChange: (next: PrizeItem[]) => void;
}) {
  // Parse legacy string JSON
  const prizes: PrizeItem[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            const x = JSON.parse(value);
            return Array.isArray(x) ? x : [];
          } catch {
            return [];
          }
        })()
      : [];

  // Normalize prizes to new format (migrate legacy data)
  const normalizedPrizes = prizes.map((p) => {
    // If already has discountType, use as-is
    if (p.discountType) return p;

    // Migrate legacy format
    if (p.discountPercentage && p.discountPercentage > 0) {
      return {
        ...p,
        discountType: "percentage" as DiscountType,
        discountValue: p.discountPercentage,
      };
    }
    if (p.discountCode) {
      return {
        ...p,
        discountType: "custom_code" as DiscountType,
      };
    }
    return {
      ...p,
      discountType: "none" as DiscountType,
    };
  });

  const total = normalizedPrizes.reduce(
    (s, p) => s + (Number(p.probability) || 0),
    0,
  );
  const invalidTotal = Math.abs(total - 100) > 0.01;

  const update = (idx: number, patch: Partial<PrizeItem>) => {
    const next = normalizedPrizes.map((p, i) =>
      i === idx ? { ...p, ...patch } : p,
    );
    onChange(next);
  };

  const add = () => {
    const next: PrizeItem[] = [
      ...normalizedPrizes,
      {
        id: `p${Date.now()}`,
        label: "New Prize",
        probability: Math.max(0, 100 - total),
        discountType: "none",
      },
    ];
    onChange(next);
  };

  const remove = (idx: number) =>
    onChange(normalizedPrizes.filter((_, i) => i !== idx));

  return (
    <BlockStack gap="300">
      {invalidTotal && (
        <Banner tone="critical">
          <Text as="p" variant="bodySm">
            Probabilities must sum to 100%. Current total: {total}%
          </Text>
        </Banner>
      )}

      {normalizedPrizes.map((prize, idx) => (
        <div
          key={prize.id || idx}
          style={{ border: "1px solid #E1E3E5", borderRadius: 8, padding: 12 }}
        >
          <BlockStack gap="200">
            <InlineStack gap="200" align="space-between" blockAlign="center">
              <Text as="h4" variant="headingSm">
                Prize #{idx + 1}
              </Text>
              <Button tone="critical" onClick={() => remove(idx)}>
                Remove
              </Button>
            </InlineStack>

            <InlineStack gap="200">
              <TextField
                label="Label"
                value={prize.label || ""}
                onChange={(v) => update(idx, { label: v })}
                autoComplete="off"
              />
              <TextField
                type="number"
                label="Probability (%)"
                value={String(prize.probability ?? 0)}
                onChange={(v) => update(idx, { probability: Number(v) || 0 })}
                min={0}
                max={100}
                autoComplete="off"
              />
            </InlineStack>

            {/* Discount Type Selector */}
            <Select
              label="Discount Type"
              options={[
                { label: "No Discount", value: "none" },
                { label: "Percentage Off", value: "percentage" },
                { label: "Fixed Amount Off", value: "fixed_amount" },
                { label: "Free Shipping", value: "free_shipping" },
                { label: "Custom Code", value: "custom_code" },
              ]}
              value={prize.discountType || "none"}
              onChange={(type) => {
                const updates: Partial<PrizeItem> = {
                  discountType: type as DiscountType,
                };
                // Clear values when switching types
                if (type === "none" || type === "free_shipping") {
                  updates.discountValue = undefined;
                  updates.discountCode = undefined;
                }
                update(idx, updates);
              }}
            />

            {/* Percentage Discount */}
            {prize.discountType === "percentage" && (
              <TextField
                type="number"
                label="Discount Percentage"
                value={String(prize.discountValue ?? "")}
                onChange={(v) =>
                  update(idx, { discountValue: Number(v) || undefined })
                }
                suffix="%"
                min={0}
                max={100}
                helpText="Percentage off the order total"
                autoComplete="off"
              />
            )}

            {/* Fixed Amount Discount */}
            {prize.discountType === "fixed_amount" && (
              <TextField
                type="number"
                label="Discount Amount"
                value={String(prize.discountValue ?? "")}
                onChange={(v) =>
                  update(idx, { discountValue: Number(v) || undefined })
                }
                prefix="$"
                min={0}
                helpText="Fixed dollar amount off the order"
                autoComplete="off"
              />
            )}

            {/* Free Shipping */}
            {prize.discountType === "free_shipping" && (
              <Box
                padding="300"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <Text as="p" variant="bodySm">
                  🚚 <strong>Free Shipping Discount</strong>
                  <br />A free shipping discount code will be automatically
                  generated when the user wins this prize.
                </Text>
              </Box>
            )}

            {/* Custom Code */}
            {prize.discountType === "custom_code" && (
              <TextField
                label="Discount Code"
                value={prize.discountCode || ""}
                onChange={(v) => update(idx, { discountCode: v })}
                autoComplete="off"
                helpText="Enter an existing Shopify discount code"
              />
            )}
          </BlockStack>
        </div>
      ))}

      <InlineStack align="space-between" blockAlign="center">
        <Text as="p" variant="bodySm">
          Total probability: {total}%
        </Text>
        <ButtonGroup>
          <Button onClick={add}>Add Prize</Button>
        </ButtonGroup>
      </InlineStack>
    </BlockStack>
  );
}
