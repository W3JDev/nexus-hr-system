import { z } from "zod";

/**
 * Validation utilities for form inputs
 * Uses Zod for type-safe validation
 */

// Employee Form Schema
export const employeeFormSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  designation: z.string().min(1, "Job title is required"),
  departmentId: z.string().optional().or(z.literal("")),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  dateJoined: z.string().min(1, "Date joined is required"),
  salary: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "on_leave", "terminated", "probation"]),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

// Leave Application Form Schema
export const leaveFormSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  reason: z.string().optional().or(z.literal("")),
}).refine(
  (data) => {
    if (!data.fromDate || !data.toDate) return true;
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    return to >= from;
  },
  {
    message: "To date must be after or equal to from date",
    path: ["toDate"],
  }
);

export type LeaveFormData = z.infer<typeof leaveFormSchema>;

// Auth Form Schemas
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Payroll Form Schema
export const payrollFormSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

export type PayrollFormData = z.infer<typeof payrollFormSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Validates form data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with success flag, parsed data, or errors
 */
export function validateForm<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Convert Zod errors to a simple record
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join(".");
    errors[path] = error.message;
  });

  return {
    success: false,
    errors,
  };
}

/**
 * Validates a single field value
 * @param schema - Zod schema for the field
 * @param value - Value to validate
 * @returns Error message or undefined if valid
 */
export function validateField<T>(schema: z.ZodType<T>, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0]?.message;
  }
  return undefined;
}

// Common field validators
export const validators = {
  email: z.string().email("Invalid email address"),
  required: z.string().min(1, "This field is required"),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number").optional().or(z.literal("")),
  positiveNumber: z.string().regex(/^\d*\.?\d+$/, "Must be a positive number").optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
};
