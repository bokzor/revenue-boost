/**
 * PreviewContext
 *
 * Manages which recipe preview is currently open.
 * Ensures only one large preview can be shown at a time across all RecipeCards.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

interface PreviewContextValue {
  /** ID of the recipe whose preview is currently open */
  activePreviewId: string | null;

  /** Open preview for a specific recipe (closes any other open preview) */
  openPreview: (recipeId: string) => void;

  /** Close the currently open preview */
  closePreview: () => void;

  /** Check if a specific recipe's preview is open */
  isPreviewOpen: (recipeId: string) => boolean;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export interface PreviewProviderProps {
  children: React.ReactNode;
}

export function PreviewProvider({ children }: PreviewProviderProps) {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  const openPreview = useCallback((recipeId: string) => {
    setActivePreviewId(recipeId);
  }, []);

  const closePreview = useCallback(() => {
    setActivePreviewId(null);
  }, []);

  const isPreviewOpen = useCallback(
    (recipeId: string) => activePreviewId === recipeId,
    [activePreviewId]
  );

  const value = useMemo(
    () => ({
      activePreviewId,
      openPreview,
      closePreview,
      isPreviewOpen,
    }),
    [activePreviewId, openPreview, closePreview, isPreviewOpen]
  );

  return (
    <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
  );
}

/**
 * Hook to access preview context.
 * Returns null if used outside of PreviewProvider (allows graceful fallback).
 */
export function usePreviewContext(): PreviewContextValue | null {
  return useContext(PreviewContext);
}

