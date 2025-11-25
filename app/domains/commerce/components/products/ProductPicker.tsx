/**
 * ProductPicker Component (Stub)
 *
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should integrate with Shopify's product API.
 *
 * Expected features:
 * - Product search
 * - Product selection (single/multiple)
 * - Product preview
 * - Manual/automatic mode
 * - Integration with Shopify Admin API
 */

import React, { useState } from "react";

export interface Product {
  id: string;
  title: string;
  handle?: string;
  image?: string;
  price?: number;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
  }>;
}

export interface ProductPickerProps {
  mode: "manual" | "automatic";
  selectedProducts: Product[];
  onModeChange: (mode: "manual" | "automatic") => void;
  onProductsChange: (products: Product[]) => void;
  maxProducts?: number;
  showSearch?: boolean;
  shopDomain?: string;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({
  mode,
  selectedProducts,
  onModeChange,
  onProductsChange,
  maxProducts = 10,
  showSearch = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.id !== productId));
  };

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#F9FAFB",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Product Picker</h3>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            onClick={() => onModeChange("manual")}
            style={{
              padding: "8px 16px",
              backgroundColor: mode === "manual" ? "#5C6AC4" : "#FFFFFF",
              color: mode === "manual" ? "#FFFFFF" : "#333",
              border: "1px solid #D1D5DB",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Manual Selection
          </button>
          <button
            onClick={() => onModeChange("automatic")}
            style={{
              padding: "8px 16px",
              backgroundColor: mode === "automatic" ? "#5C6AC4" : "#FFFFFF",
              color: mode === "automatic" ? "#FFFFFF" : "#333",
              border: "1px solid #D1D5DB",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Automatic (AI)
          </button>
        </div>
      </div>

      {mode === "manual" && showSearch && (
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #D1D5DB",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </div>
      )}

      {selectedProducts.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500" }}>
            Selected Products ({selectedProducts.length}/{maxProducts})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                }}
              >
                <span style={{ fontSize: "14px" }}>{product.title}</span>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#DC2626",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "16px" }}>
        TODO: Integrate with Shopify Product API for product search and selection
      </p>
    </div>
  );
};

export default ProductPicker;
