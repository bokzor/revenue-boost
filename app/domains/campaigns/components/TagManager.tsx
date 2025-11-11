/**
 * TagManager - Component for managing campaign tags
 *
 * SOLID Compliance:
 * - Single Responsibility: Only handles tag management
 * - Extracted from ScheduleSettingsStep for better reusability
 */

import React, { useState } from "react";
import {
  FormLayout,
  TextField,
  BlockStack,
  InlineStack,
  Tag,
  Text,
  Box,
} from "@shopify/polaris";

interface TagManagerProps {
  tags?: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagManager({ tags = [], onTagsChange }: TagManagerProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...tags, tagInput.trim()];
      onTagsChange(newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAddTag();
  };

  return (
    <FormLayout>
      <InlineStack gap="200" align="start">
        <Box minWidth="300px">
          <form onSubmit={handleFormSubmit} noValidate>
            <TextField
              label="Add Tag"
              value={tagInput}
              onChange={setTagInput}
              placeholder="e.g., summer, sale, newsletter"
              autoComplete="off"
              connectedRight={
                <button
                  type="submit"
                  disabled={!tagInput.trim()}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: tagInput.trim() ? "#008060" : "#e0e0e0",
                    color: tagInput.trim() ? "white" : "#999",
                    border: "none",
                    borderRadius: "4px",
                    cursor: tagInput.trim() ? "pointer" : "not-allowed",
                    height: "36px",
                  }}
                >
                  Add
                </button>
              }
            />
          </form>
        </Box>
      </InlineStack>

      {tags.length > 0 && (
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" fontWeight="semibold">
            Current Tags ({tags.length}):
          </Text>
          <InlineStack gap="200" wrap>
            {tags.map((tag) => (
              <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>
                {tag}
              </Tag>
            ))}
          </InlineStack>
        </BlockStack>
      )}
    </FormLayout>
  );
}

