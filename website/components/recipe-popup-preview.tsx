"use client"

/**
 * RecipePopupPreview - Renders recipe previews by ID for the marketing hero
 *
 * Uses a fully responsive container that adapts to screen size.
 * Smooth CSS transitions between aspect ratios.
 */

import React, { useEffect, useState, useCallback } from "react"

type SizeType = "small" | "medium" | "large"

interface RecipePopupPreviewProps {
  recipeId: string
  size?: SizeType
}

// Time before popup respawns after being closed (in ms)
const RESPAWN_DELAY = 2500

// Loading placeholder
const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] text-muted-foreground/50">
    <div className="text-center">
      <div className="text-5xl mb-4">✨</div>
      <div>Loading preview...</div>
    </div>
  </div>
)

// Closed state placeholder
const ClosedPlaceholder = () => (
  <div className="flex items-center justify-center h-full min-h-[300px] text-foreground/40 bg-muted rounded-xl">
    <div className="text-center">
      <div className="text-3xl mb-3">👋</div>
      <div className="text-sm">Popup closed</div>
      <div className="text-xs opacity-70 mt-1">Reappearing soon...</div>
    </div>
  </div>
)

// Size classes for responsive container with smooth transitions
const SIZE_CLASSES = {
  small: "w-full max-w-[320px] aspect-[9/16]",
  medium: "w-full max-w-[420px] aspect-[4/5]",
  large: "w-full max-w-[520px] aspect-[5/4]",
} as const

export default function RecipePopupPreview({ recipeId, size = "medium" }: RecipePopupPreviewProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [PreviewComponent, setPreviewComponent] = useState<React.ComponentType<{
    templateType: string
    config: Record<string, unknown>
    designConfig: Record<string, unknown>
    isVisible?: boolean
    onClose?: () => void
  }> | null>(null)
  const [recipeConfig, setRecipeConfig] = useState<{
    templateType: string
    contentConfig: Record<string, unknown>
    designConfig: Record<string, unknown>
  } | null>(null)

  // Handle close - hide popup and schedule respawn
  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      setIsVisible(true)
    }, RESPAWN_DELAY)
  }, [])

  // Reset visibility when recipe changes
  useEffect(() => {
    setIsVisible(true)
  }, [recipeId])

  useEffect(() => {
    setMounted(true)

    // Dynamic imports to avoid SSR issues
    Promise.all([
      import("~/domains/popups/components/preview/TemplatePreview"),
      import("~/shared/preview/recipe-marketing-data"),
    ]).then(([previewModule, recipeModule]) => {
      setPreviewComponent(() => previewModule.TemplatePreview)
      const recipe = recipeModule.getStyledRecipeForMarketing(recipeId)
      if (recipe) {
        setRecipeConfig({
          templateType: recipe.templateType,
          contentConfig: recipe.defaults.contentConfig || {},
          designConfig: recipe.defaults.designConfig || {},
        })
      }
    })
  }, [recipeId])

  if (!mounted || !PreviewComponent || !recipeConfig) {
    return (
      <div className={`${SIZE_CLASSES[size]} transition-all duration-500 ease-out`}>
        <LoadingPlaceholder />
      </div>
    )
  }

  const config = {
    ...recipeConfig.contentConfig,
    previewMode: true,
  }

  const designConfig = {
    ...recipeConfig.designConfig,
    previewMode: true,
    disablePortal: true,
  }

  return (
    <div
      className={`
        ${SIZE_CLASSES[size]}
        relative rounded-2xl overflow-hidden
        shadow-2xl bg-white
        transition-all duration-500 ease-out
      `}
    >
      {/* Browser-like address bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 ml-2 px-2.5 py-1 bg-white rounded text-[10px] sm:text-xs text-gray-500 border border-gray-200 truncate">
          your-store.myshopify.com
        </div>
      </div>

      {/* Content area */}
      <div className="relative h-[calc(100%-36px)] overflow-hidden bg-gray-50">
        {isVisible ? (
          <PreviewComponent
            templateType={recipeConfig.templateType}
            config={config}
            designConfig={designConfig}
            onClose={handleClose}
          />
        ) : (
          <ClosedPlaceholder />
        )}
      </div>
    </div>
  )
}

