/**
 * CollectionValueInput - Collection selector for condition values
 * 
 * Single Responsibility: Handle collection selection for conditions
 */

import { useState } from "react";
import { Button, Modal } from "@shopify/polaris";
import { CollectionIcon } from "@shopify/polaris-icons";

// Temporary type stub
type Collection = { id: string; title: string };

interface CollectionValueInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollectionValueInput({ value, onChange }: CollectionValueInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  let selectedCollection: Collection | null = null;
  try {
    selectedCollection = value ? (JSON.parse(value) as Collection) : null;
  } catch (error) {
    selectedCollection = null;
  }

  return (
    <>
      <Button
        icon={CollectionIcon}
        onClick={() => setShowPicker(true)}
        variant={selectedCollection ? "secondary" : "primary"}
      >
        {selectedCollection ? selectedCollection.title : "Select Collection"}
      </Button>

      <Modal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title="Select Collection"
        primaryAction={{
          content: "Done",
          onAction: () => setShowPicker(false),
        }}
      >
        <Modal.Section>
          <p>Collection picker coming soon. The CollectionPicker component needs to be created.</p>
          {/* TODO: Uncomment when CollectionPicker is created
          <CollectionPicker
            selectedCollection={selectedCollection || undefined}
            onCollectionChange={(collection) => {
              if (collection) {
                onChange(JSON.stringify(collection));
              } else {
                onChange("");
              }
            }}
            showSearch={true}
          />
          */}
        </Modal.Section>
      </Modal>
    </>
  );
}

