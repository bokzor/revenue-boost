/**
 * useFormValidation - Simple Zod-based form validation
 */

import { useState, useCallback, useMemo } from "react";
import { z } from "zod";

export function useFormValidation<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const validate = useCallback(
    async (data: unknown): Promise<boolean> => {
      try {
        await schema.parseAsync(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((err: z.ZodIssue) => {
            fieldErrors[err.path.join(".")] = err.message;
          });
          setErrors(fieldErrors);
        }
        return false;
      }
    },
    [schema]
  );

  const touch = useCallback((field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  }, []);

  const getError = useCallback(
    (field: string) => (touched.has(field) ? errors[field] : undefined),
    [errors, touched]
  );

  const reset = useCallback(() => {
    setErrors({});
    setTouched(new Set());
  }, []);

  return {
    errors,
    isValid,
    validate,
    touch,
    getError,
    reset,
  };
}

