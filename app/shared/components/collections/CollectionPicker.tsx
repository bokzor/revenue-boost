/**
 * CollectionPicker Component (Stub)
 * 
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should integrate with Shopify's collection API.
 * 
 * Expected features:
 * - Collection search
 * - Collection selection
 * - Collection preview
 * - Integration with Shopify Admin API
 */

import React, { useState } from "react";

export interface Collection {
  id: string;
  title: string;
  handle?: string;
  image?: string;
  productsCount?: number;
}

export interface CollectionPickerProps {
  selectedCollection?: Collection;
  onCollectionChange: (collection: Collection | null) => void;
  showSearch?: boolean;
  shopDomain?: string;
}

export const CollectionPicker: React.FC<CollectionPickerProps> = ({
  selectedCollection,
  onCollectionChange,
  showSearch = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleClearSelection = () => {
    onCollectionChange(null);
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
      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>
        Collection Picker
      </h3>

      {showSearch && (
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
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

      {selectedCollection ? (
        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "500" }}>
            Selected Collection
          </h4>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "4px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "500" }}>
                {selectedCollection.title}
              </p>
              {selectedCollection.productsCount !== undefined && (
                <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                  {selectedCollection.productsCount} products
                </p>
              )}
            </div>
            <button
              onClick={handleClearSelection}
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
        </div>
      ) : (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            border: "2px dashed #D1D5DB",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>
            No collection selected
          </p>
        </div>
      )}

      <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "16px" }}>
        TODO: Integrate with Shopify Collection API for collection search and selection
      </p>
    </div>
  );
};

export default CollectionPicker;

