/**
 * Tests for validation utilities
 */
import { describe, it, expect } from "vitest";
import {
  validateForm,
  validateField,
  employeeFormSchema,
  leaveFormSchema,
  loginSchema,
  registerSchema,
  validators,
} from "../lib/validation";

describe("validation", () => {
  describe("employeeFormSchema", () => {
    const validEmployee = {
      employeeId: "EMP-0001",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      designation: "Software Engineer",
      departmentId: "1",
      employmentType: "full_time" as const,
      dateJoined: "2024-01-01",
      salary: "5000",
      status: "active" as const,
    };

    it("should validate a valid employee form", () => {
      const result = validateForm(employeeFormSchema, validEmployee);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validEmployee);
    });

    it("should fail when required fields are missing", () => {
      const result = validateForm(employeeFormSchema, {
        ...validEmployee,
        firstName: "",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("firstName");
    });

    it("should fail with invalid email", () => {
      const result = validateForm(employeeFormSchema, {
        ...validEmployee,
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("email");
    });

    it("should allow optional fields to be empty", () => {
      const result = validateForm(employeeFormSchema, {
        ...validEmployee,
        phone: "",
        salary: "",
        departmentId: "",
      });
      expect(result.success).toBe(true);
    });

    it("should fail with too long name", () => {
      const result = validateForm(employeeFormSchema, {
        ...validEmployee,
        firstName: "a".repeat(51),
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("firstName");
    });
  });

  describe("leaveFormSchema", () => {
    const validLeave = {
      employeeId: "1",
      leaveTypeId: "1",
      fromDate: "2024-01-01",
      toDate: "2024-01-05",
      reason: "Vacation",
    };

    it("should validate valid leave application", () => {
      const result = validateForm(leaveFormSchema, validLeave);
      expect(result.success).toBe(true);
    });

    it("should fail when toDate is before fromDate", () => {
      const result = validateForm(leaveFormSchema, {
        ...validLeave,
        fromDate: "2024-01-10",
        toDate: "2024-01-05",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("toDate");
    });

    it("should allow same day leave", () => {
      const result = validateForm(leaveFormSchema, {
        ...validLeave,
        fromDate: "2024-01-01",
        toDate: "2024-01-01",
      });
      expect(result.success).toBe(true);
    });

    it("should fail when required fields are missing", () => {
      const result = validateForm(leaveFormSchema, {
        ...validLeave,
        employeeId: "",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("employeeId");
    });
  });

  describe("loginSchema", () => {
    it("should validate valid login", () => {
      const result = validateForm(loginSchema, {
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail with short password", () => {
      const result = validateForm(loginSchema, {
        email: "user@example.com",
        password: "123",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("password");
    });

    it("should fail with invalid email", () => {
      const result = validateForm(loginSchema, {
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("email");
    });
  });

  describe("registerSchema", () => {
    it("should validate valid registration", () => {
      const result = validateForm(registerSchema, {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail with short name", () => {
      const result = validateForm(registerSchema, {
        name: "J",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("name");
    });
  });

  describe("validateField", () => {
    it("should return undefined for valid email", () => {
      const error = validateField(validators.email, "test@example.com");
      expect(error).toBeUndefined();
    });

    it("should return error for invalid email", () => {
      const error = validateField(validators.email, "invalid");
      expect(error).toBe("Invalid email address");
    });

    it("should return undefined for optional empty phone", () => {
      const error = validateField(validators.phone, "");
      expect(error).toBeUndefined();
    });

    it("should return error for invalid phone", () => {
      const error = validateField(validators.phone, "abc");
      expect(error).toBe("Invalid phone number");
    });
  });

  describe("error messages", () => {
    it("should provide clear error messages", () => {
      const result = validateForm(loginSchema, {
        email: "",
        password: "",
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.password).toBe("Password must be at least 6 characters");
    });
  });
});
