import { z } from "zod";

export const registerDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ORGANIZER", "CUSTOMER"], {
    error: "Role must be either ORGANIZER or CUSTOMER",
  }),
});

export const loginDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
