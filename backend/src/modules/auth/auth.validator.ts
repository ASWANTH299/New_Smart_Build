import { z } from "zod";

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address format"),
    password: z.string().min(1, "Password is required"),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address format"),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
  }),
};

export const activateAccountSchema = {
  body: z.object({
    token: z.string().min(1, "Activation token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
  }),
};
