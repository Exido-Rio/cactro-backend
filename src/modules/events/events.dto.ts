import { z } from "zod";

export const createEventDto = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Use ISO 8601 format (e.g., 2025-12-31T18:00:00Z)",
  }),
  totalTickets: z.number().int().positive("Total tickets must be a positive integer"),
  price: z.number().nonnegative("Price must be 0 or greater"),
});

export const updateEventDto = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  totalTickets: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
});

export type CreateEventDto = z.infer<typeof createEventDto>;
export type UpdateEventDto = z.infer<typeof updateEventDto>;
