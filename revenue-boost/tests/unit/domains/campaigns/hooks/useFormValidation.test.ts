/**
 * useFormValidation Hook Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from '~/domains/campaigns/hooks/useFormValidation';

describe('useFormValidation', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be 18 or older'),
  });

  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it('should validate valid data', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validate(validData);
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it('should detect validation errors', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    const invalidData = {
      name: '',
      email: 'invalid-email',
      age: 15,
    };

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validate(invalidData);
    });

    expect(isValid).toBe(false);
    expect(result.current.errors).toHaveProperty('name');
    expect(result.current.errors).toHaveProperty('email');
    expect(result.current.errors).toHaveProperty('age');
    expect(result.current.isValid).toBe(false);
  });

  it('should track touched fields', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    act(() => {
      result.current.touch('name');
      result.current.touch('email');
    });

    // Errors should only show for touched fields
    expect(result.current.getError('name')).toBeUndefined();
    expect(result.current.getError('email')).toBeUndefined();
    expect(result.current.getError('age')).toBeUndefined();
  });

  it('should show errors only for touched fields', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    const invalidData = {
      name: '',
      email: 'invalid',
      age: 15,
    };

    await act(async () => {
      await result.current.validate(invalidData);
    });

    act(() => {
      result.current.touch('name');
    });

    expect(result.current.getError('name')).toBeDefined();
    expect(result.current.getError('email')).toBeUndefined(); // Not touched
    expect(result.current.getError('age')).toBeUndefined(); // Not touched
  });

  it('should reset errors and touched fields', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    const invalidData = {
      name: '',
      email: 'invalid',
      age: 15,
    };

    await act(async () => {
      await result.current.validate(invalidData);
      result.current.touch('name');
      result.current.touch('email');
    });

    expect(result.current.errors).not.toEqual({});

    act(() => {
      result.current.reset();
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.getError('name')).toBeUndefined();
    expect(result.current.getError('email')).toBeUndefined();
  });

  it('should handle nested field errors', async () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1, 'Name required'),
        }),
      }),
    });

    const { result } = renderHook(() => useFormValidation(nestedSchema));

    const invalidData = {
      user: {
        profile: {
          name: '',
        },
      },
    };

    await act(async () => {
      await result.current.validate(invalidData);
      result.current.touch('user.profile.name');
    });

    expect(result.current.getError('user.profile.name')).toBeDefined();
  });

  it('should update validation when schema changes', async () => {
    const schema1 = z.object({
      name: z.string().min(1),
    });

    const schema2 = z.object({
      name: z.string().min(5, 'Name must be at least 5 characters'),
    });

    const { result, rerender } = renderHook(
      ({ schema }) => useFormValidation(schema),
      { initialProps: { schema: schema1 } }
    );

    const data = { name: 'Jo' };

    // Should pass with schema1
    await act(async () => {
      const isValid = await result.current.validate(data);
      expect(isValid).toBe(true);
    });

    // Change to schema2
    rerender({ schema: schema2 });

    // Should fail with schema2
    await act(async () => {
      const isValid = await result.current.validate(data);
      expect(isValid).toBe(false);
    });
  });
});

