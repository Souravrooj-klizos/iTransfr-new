'use client';

import { useCallback, useState } from 'react';
import { ZodError, ZodSchema } from 'zod';

export interface ValidationErrors {
  [key: string]: string;
}

export interface UseFormValidationReturn {
  errors: ValidationErrors;
  validateField: (fieldName: string, value: any, schema: ZodSchema) => boolean;
  validateForm: (data: any, schema: ZodSchema, fieldMapping?: Record<string, string>) => boolean;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
  setFieldError: (fieldName: string, message: string) => void;
  hasErrors: boolean;
  getFieldError: (fieldName: string) => string | undefined;
}

/**
 * Custom hook for form validation using Zod schemas.
 * Provides field-level error tracking and validation.
 */
export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validates a single field against a schema.
   * Returns true if valid, false if invalid.
   */
  const validateField = useCallback((fieldName: string, value: any, schema: ZodSchema): boolean => {
    try {
      // Create an object with just this field and validate it
      const data = { [fieldName]: value };
      schema.parse(data);

      // Clear error for this field if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors.find(e => e.path.includes(fieldName));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: fieldError.message,
          }));
        }
      }
      return false;
    }
  }, []);

  /**
   * Validates the entire form data against a schema.
   * Updates all field errors at once.
   * Returns true if valid, false if invalid.
   * @param fieldMapping - Optional mapping of validation paths to form field names
   */
  const validateForm = useCallback((data: any, schema: ZodSchema, fieldMapping?: Record<string, string>): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: ValidationErrors = {};
        error.errors.forEach(err => {
          // Create a path string for nested fields (e.g., "address.city")
          const path = err.path.join('.');
          if (path && !newErrors[path]) {
            newErrors[path] = err.message;

            // Also add mapped field name if mapping exists
            if (fieldMapping && fieldMapping[path]) {
              newErrors[fieldMapping[path]] = err.message;
            }
          }
        });

        // Log errors for debugging
        console.log('🔴 Validation Errors:', newErrors);
        console.log('📝 Error Details:', error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code
        })));

        setErrors(newErrors);
      }
      return false;
    }
  }, []);

  /**
   * Clears error for a specific field.
   */
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Clears all errors.
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Manually set an error for a field.
   */
  const setFieldError = useCallback((fieldName: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: message,
    }));
  }, []);

  /**
   * Gets the error message for a specific field.
   */
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors[fieldName];
  }, [errors]);

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError,
  };
}

/**
 * Helper component to display field error below an input.
 */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <p className="mt-1 text-sm text-red-600">
      {error}
    </p>
  );
}
