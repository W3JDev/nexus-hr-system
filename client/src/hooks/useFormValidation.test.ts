/**
 * Tests for useFormValidation hook
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation, useFormSubmit } from "./useFormValidation";
import { loginSchema } from "../lib/validation";

describe("useFormValidation", () => {
  const initialValues = {
    email: "",
    password: "",
  };

  it("should initialize with provided values", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it("should update values on handleChange", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "email", value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.email).toBe("test@example.com");
  });

  it("should track touched on handleBlur", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: "email", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.touched.email).toBe(true);
  });

  it("should validate form and return errors", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    let validationResult;
    act(() => {
      validationResult = result.current.validate();
    });

    expect(validationResult?.success).toBe(false);
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.password).toBeDefined();
  });

  it("should validate form successfully with valid data", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    // Set valid values
    act(() => {
      result.current.handleChange({
        target: { name: "email", value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password", value: "password123" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    let validationResult;
    act(() => {
      validationResult = result.current.validate();
    });

    expect(validationResult?.success).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it("should reset form to initial values", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    // Modify values
    act(() => {
      result.current.handleChange({
        target: { name: "email", value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.email).toBe("test@example.com");
    expect(result.current.isDirty).toBe(true);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it("should clear errors", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    // Validate to create errors
    act(() => {
      result.current.validate();
    });

    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    // Clear errors
    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it("should set field value programmatically", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    act(() => {
      result.current.setFieldValue("email", "set@example.com");
    });

    expect(result.current.values.email).toBe("set@example.com");
    expect(result.current.touched.email).toBe(true);
  });

  it("should track isDirty correctly", () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: loginSchema,
        initialValues,
      })
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.handleChange({
        target: { name: "email", value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.isDirty).toBe(true);
  });
});

describe("useFormSubmit", () => {
  it("should initialize with correct state", () => {
    const { result } = renderHook(() => useFormSubmit());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(result.current.submitSuccess).toBe(false);
  });

  it("should set isSubmitting on startSubmit", () => {
    const { result } = renderHook(() => useFormSubmit());

    act(() => {
      result.current.startSubmit();
    });

    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.submitError).toBeNull();
    expect(result.current.submitSuccess).toBe(false);
  });

  it("should set success on endSubmit without error", () => {
    const { result } = renderHook(() => useFormSubmit());

    act(() => {
      result.current.startSubmit();
      result.current.endSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitSuccess).toBe(true);
    expect(result.current.submitError).toBeNull();
  });

  it("should set error on endSubmit with error", () => {
    const { result } = renderHook(() => useFormSubmit());

    act(() => {
      result.current.startSubmit();
      result.current.endSubmit("Network error");
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitSuccess).toBe(false);
    expect(result.current.submitError).toBe("Network error");
  });

  it("should reset to initial state", () => {
    const { result } = renderHook(() => useFormSubmit());

    act(() => {
      result.current.startSubmit();
      result.current.endSubmit();
    });

    expect(result.current.submitSuccess).toBe(true);

    act(() => {
      result.current.resetSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(result.current.submitSuccess).toBe(false);
  });
});
