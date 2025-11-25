/**
 * useVariantManager - Simplified A/B testing variant state management
 */

import { useState, useCallback, useMemo } from "react";
import { produce } from "immer";

export type VariantKey = "A" | "B" | "C" | "D";

export interface VariantData<T> {
  key: VariantKey;
  isControl: boolean;
  trafficAllocation: number;
  data: T;
}

export function useVariantManager<T>(initialData: T, initialCount = 2) {
  const [variants, setVariants] = useState<VariantData<T>[]>(() =>
    initializeVariants(initialCount, initialData)
  );
  const [selectedKey, setSelectedKey] = useState<VariantKey>("A");
  const [count, setCount] = useState(initialCount);

  const activeVariants = useMemo(() => variants.slice(0, count), [variants, count]);
  const selected = useMemo(
    () => activeVariants.find((v) => v.key === selectedKey) ?? activeVariants[0],
    [activeVariants, selectedKey]
  );

  const updateData = useCallback((key: VariantKey, updates: Partial<T>) => {
    setVariants((prev) =>
      produce(prev, (draft: VariantData<T>[]) => {
        const variant = draft.find((v: VariantData<T>) => v.key === key);
        if (variant) {
          variant.data = { ...variant.data, ...updates };
        }
      })
    );
  }, []);

  const setCountAndRecalculate = useCallback((newCount: number) => {
    setCount(newCount);
    const allocation = calculateTraffic(newCount);
    setVariants((prev) =>
      produce(prev, (draft: VariantData<T>[]) => {
        draft.forEach((v: VariantData<T>, i: number) => {
          if (i < newCount) v.trafficAllocation = allocation[v.key];
        });
      })
    );
  }, []);

  return {
    variants: activeVariants,
    selected,
    selectedKey,
    count,
    updateData,
    selectVariant: setSelectedKey,
    setCount: setCountAndRecalculate,
  };
}

function initializeVariants<T>(count: number, data: T): VariantData<T>[] {
  const keys: VariantKey[] = ["A", "B", "C", "D"];
  const allocation = calculateTraffic(count);

  return keys.map((key, i) => ({
    key,
    isControl: i === 0,
    trafficAllocation: allocation[key],
    data: structuredClone(data),
  }));
}

function calculateTraffic(count: number): Record<VariantKey, number> {
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  const keys: VariantKey[] = ["A", "B", "C", "D"];

  return keys.reduce(
    (acc, key, i) => {
      acc[key] = i < count ? base + (i === 0 ? remainder : 0) : 0;
      return acc;
    },
    {} as Record<VariantKey, number>
  );
}
