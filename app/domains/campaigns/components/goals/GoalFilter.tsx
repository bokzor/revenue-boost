/**
 * GoalFilter - Goal selector with full context for filtering recipes
 *
 * Used on recipe page to filter recipes by goal.
 * Shows goal details (description, benefits, metrics) to help users choose.
 */

import { Text, Icon, InlineStack, BlockStack, Badge } from "@shopify/polaris";
import type { CampaignGoal } from "@prisma/client";
import { GOAL_OPTIONS, getDifficultyColor, type GoalOption } from "../../config/goal-options";
import styles from "./GoalFilter.module.css";

interface GoalFilterProps {
  /** Currently selected goal (null = show all) */
  value: CampaignGoal | null;
  /** Called when goal selection changes */
  onChange: (goal: CampaignGoal | null) => void;
  /** Optional: Show recipe count per goal */
  recipeCounts?: Record<CampaignGoal, number>;
  /** Optional: Total recipes when no goal selected */
  totalRecipes?: number;
}

export function GoalFilter({
  value,
  onChange,
  recipeCounts,
  totalRecipes,
}: GoalFilterProps) {
  return (
    <BlockStack gap="500">
      {/* Header */}
      <BlockStack gap="100">
        <Text as="h2" variant="headingLg">
          What&apos;s your goal?
        </Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          Choose your objective and we&apos;ll show you the best recipes to achieve it
        </Text>
      </BlockStack>

      {/* Goal Cards Grid */}
      <div className={styles.goalGrid}>
        {/* All Recipes option */}
        <button
          className={`${styles.goalCard} ${styles.allRecipesCard} ${value === null ? styles.selected : ""}`}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
        >
          <BlockStack gap="300">
            <InlineStack gap="300" blockAlign="center">
              <div className={styles.iconWrapper} style={{ backgroundColor: "#6366F115" }}>
                <Text as="span" variant="headingMd">📚</Text>
              </div>
              <BlockStack gap="050">
                <Text as="span" variant="headingSm" fontWeight="semibold">
                  All Recipes
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  Browse everything
                </Text>
              </BlockStack>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              Explore all {totalRecipes} recipes across every goal
            </Text>
          </BlockStack>
          {value === null && <div className={styles.selectedIndicator} />}
        </button>

        {/* Goal options with full context */}
        {GOAL_OPTIONS.map((option) => (
          <GoalFilterCard
            key={option.id}
            option={option}
            isSelected={value === option.id}
            onClick={() => onChange(option.id)}
            recipeCount={recipeCounts?.[option.id]}
          />
        ))}
      </div>
    </BlockStack>
  );
}

interface GoalFilterCardProps {
  option: GoalOption;
  isSelected: boolean;
  onClick: () => void;
  recipeCount?: number;
}

function GoalFilterCard({ option, isSelected, onClick, recipeCount }: GoalFilterCardProps) {
  const IconComponent = option.icon;

  return (
    <button
      className={`${styles.goalCard} ${isSelected ? styles.selected : ""}`}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <BlockStack gap="300">
        {/* Header with icon, title, and badges */}
        <InlineStack gap="300" blockAlign="start">
          <div
            className={styles.iconWrapper}
            style={{ backgroundColor: `${option.iconColor}15` }}
          >
            <div style={{ color: option.iconColor }}>
              <Icon source={IconComponent} />
            </div>
          </div>
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center" wrap>
              <Text as="span" variant="headingSm" fontWeight="semibold">
                {option.title}
              </Text>
              {option.badge && (
                <Badge tone="success" size="small">{option.badge}</Badge>
              )}
            </InlineStack>
            <Text as="span" variant="bodySm" tone="subdued">
              {option.subtitle}
            </Text>
          </BlockStack>
        </InlineStack>

        {/* Description */}
        <Text as="p" variant="bodySm">
          {option.description}
        </Text>

        {/* Benefits */}
        <div className={styles.benefitsContainer}>
          {option.benefits.map((benefit, index) => (
            <div key={index} className={styles.benefitPill}>
              <Text as="span" variant="bodySm">✓ {benefit}</Text>
            </div>
          ))}
        </div>

        {/* Footer: Metrics + Difficulty + Recipe count */}
        <InlineStack align="space-between" blockAlign="center" wrap>
          <div className={styles.metrics}>
            <Text as="span" variant="bodySm" fontWeight="medium">
              📊 {option.metrics}
            </Text>
          </div>
          <InlineStack gap="200" blockAlign="center">
            <Badge tone={getDifficultyColor(option.difficulty)} size="small">
              {option.difficulty}
            </Badge>
            {recipeCount !== undefined && (
              <Text as="span" variant="bodySm" tone="subdued">
                {recipeCount} recipes
              </Text>
            )}
          </InlineStack>
        </InlineStack>
      </BlockStack>
      {isSelected && <div className={styles.selectedIndicator} />}
    </button>
  );
}
