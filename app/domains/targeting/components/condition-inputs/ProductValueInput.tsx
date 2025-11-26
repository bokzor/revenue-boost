/**
 * ProductValueInput - Product selector for condition values
 *
 * Single Responsibility: Handle product selection for conditions
 */

import { useState } from "react";
import { Button, Modal } from "@shopify/polaris";
import { ProductIcon } from "@shopify/polaris-icons";

// Temporary type stub
type Product = { id: string; title: string };

interface ProductValueInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductValueInput({ value, onChange }: ProductValueInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  let selectedProduct: Product | null = null;
  try {
    selectedProduct = value ? (JSON.parse(value) as Product) : null;
  } catch (error) {
    selectedProduct = null;
  }

  return (
    <>
      <Button
        icon={ProductIcon}
        onClick={() => setShowPicker(true)}
        variant={selectedProduct ? "secondary" : "primary"}
      >
        {selectedProduct ? selectedProduct.title : "Select Product"}
      </Button>

      <Modal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title="Select Product"
        primaryAction={{
          content: "Done",
          onAction: () => setShowPicker(false),
        }}
      >
        <Modal.Section>
          <p>Product picker coming soon. The ProductPicker component needs to be created.</p>
          {/* TODO: Uncomment when ProductPicker is created
          <ProductPicker
            mode="manual"
            selectedProducts={selectedProduct ? [selectedProduct] : []}
            onModeChange={() => {}}
            onProductsChange={(products) => {
              if (products.length > 0) {
                onChange(JSON.stringify(products[0]));
              } else {
                onChange("");
              }
            }}
            maxProducts={1}
            showSearch={true}
          />
          */}
        </Modal.Section>
      </Modal>
    </>
  );
}
