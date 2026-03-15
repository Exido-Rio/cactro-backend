import { z } from "zod";

export const createBookingDto = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  numberOfTickets: z.number().int().positive("Number of tickets must be a positive integer"),
});

export type CreateBookingDto = z.infer<typeof createBookingDto>;
