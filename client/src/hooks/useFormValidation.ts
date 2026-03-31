import { useState, useCallback, ChangeEvent } from "react";
import { z } from "zod";
import { validateForm, ValidationResult } from "../lib/validation";

/**
 * Form field state
 */
interface FieldState {
  value: string;
  error?: string;
  touched: boolean;
}

/**
 * Configuration for useFormValidation hook
 */
interface UseFormValidationConfig<T> {
  schema: z.ZodType<T>;
  initialValues: Record<string, string>;
}

/**
 * Return type for useFormValidation hook
 */
interface UseFormValidationReturn<T> {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFieldValue: (field: string, value: string) => void;
  validate: () => ValidationResult<T>;
  reset: () => void;
  clearErrors: () => void;
}

/**
 * Custom hook for form validation with Zod
 * 
 * @example
 * ```tsx
 * const { values, errors, handleChange, validate } = useFormValidation({
 *   schema: employeeFormSchema,
 *   initialValues: { firstName: "", lastName: "", email: "" }
 * });
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   const result = validate();
 *   if (result.success) {
 *     // Submit result.data
 *   }
 * };
 * ```
 */
export function useFormValidation<T>({
  schema,
  initialValues,
}: UseFormValidationConfig<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [initialState] = useState(initialValues);

  /**
   * Check if form has been modified from initial values
   */
  const isDirty = Object.keys(values).some(
    (key) => values[key] !== initialState[key]
  );

  /**
   * Check if form is valid (no errors and all required fields touched)
   */
  const isValid = Object.keys(errors).length === 0 && isDirty;

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (name: string, value: string) => {
      const testData = { ...values, [name]: value };
      const result = validateForm(schema, testData);
      
      if (!result.success && result.errors) {
        // Only return error for this specific field
        return result.errors[name];
      }
      return undefined;
    },
    [schema, values]
  );

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  /**
   * Handle input blur (for showing validation errors)
   */
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      
      const error = validateField(name, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField]
  );

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate the field
    const testData = { ...values, [field]: value };
    const result = validateForm(schema, testData);
    
    if (!result.success && result.errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors![field] }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [schema, values]);

  /**
   * Validate entire form
   */
  const validate = useCallback((): ValidationResult<T> => {
    const result = validateForm(schema, values);
    
    if (!result.success && result.errors) {
      setErrors(result.errors);
      setTouched(
        Object.keys(values).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
    } else {
      setErrors({});
    }
    
    return result;
  }, [schema, values]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    setFieldValue,
    validate,
    reset,
    clearErrors,
  };
}

/**
 * Simple hook for tracking form submission state
 */
export function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const startSubmit = useCallback(() => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  const endSubmit = useCallback((error?: string) => {
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
      setSubmitSuccess(false);
    } else {
      setSubmitError(null);
      setSubmitSuccess(true);
    }
  }, []);

  const resetSubmit = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    startSubmit,
    endSubmit,
    resetSubmit,
  };
}
