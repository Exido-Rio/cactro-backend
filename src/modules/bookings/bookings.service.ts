import prisma from "../../prisma/client";
import { jobQueue } from "../../queue/job-queue";
import { CreateBookingDto } from "./bookings.dto";

/**
 * Bookings Service
 * Handles ticket booking, listing, and cancellation.
 * Uses Prisma transactions to ensure ticket counts stay consistent.
 */
export class BookingsService {
  /**
   * Create a new booking
   * - Validates event exists and has enough tickets
   * - Decrements availableTickets in a transaction
   * - Dispatches booking-confirmation background job
   */
  async create(customerId: string, customerEmail: string, dto: CreateBookingDto) {
    // Use a transaction to ensure atomic ticket decrement
    const booking = await prisma.$transaction(async (tx) => {
      // Fetch event
      const event = await tx.event.findUnique({
        where: { id: dto.eventId },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.availableTickets < dto.numberOfTickets) {
        throw new Error(
          `Not enough tickets available. Only ${event.availableTickets} tickets remaining.`
        );
      }

      // Decrement available tickets
      await tx.event.update({
        where: { id: dto.eventId },
        data: {
          availableTickets: {
            decrement: dto.numberOfTickets,
          },
        },
      });

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          customerId,
          eventId: dto.eventId,
          numberOfTickets: dto.numberOfTickets,
          totalPrice: event.price * dto.numberOfTickets,
          status: "CONFIRMED",
        },
        include: {
          event: {
            select: { title: true, date: true, location: true },
          },
        },
      });

      return newBooking;
    });

    // Fetch customer name for the confirmation email
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { name: true },
    });

    // Dispatch background job for booking confirmation
    jobQueue.enqueue("booking-confirmation", {
      bookingId: booking.id,
      customerEmail,
      customerName: customer?.name || "Customer",
      eventTitle: booking.event.title,
      numberOfTickets: booking.numberOfTickets,
      totalPrice: booking.totalPrice,
    });

    return booking;
  }

  /**
   * List all bookings for a specific customer
   */
  async findAllByCustomer(customerId: string) {
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return bookings;
  }

  /**
   * Get a single booking by ID (customer must own the booking)
   */
  async findById(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            price: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.customerId !== customerId) {
      throw new Error("You can only view your own bookings");
    }

    return booking;
  }

  /**
   * Cancel a booking
   * - Validates ownership
   * - Restores available tickets in a transaction
   * - Sets booking status to CANCELLED
   */
  async cancel(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.customerId !== customerId) {
      throw new Error("You can only cancel your own bookings");
    }

    if (booking.status === "CANCELLED") {
      throw new Error("Booking is already cancelled");
    }

    // Use transaction to restore tickets and update status atomically
    const cancelled = await prisma.$transaction(async (tx) => {
      // Restore available tickets
      await tx.event.update({
        where: { id: booking.eventId },
        data: {
          availableTickets: {
            increment: booking.numberOfTickets,
          },
        },
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
        include: {
          event: {
            select: { title: true },
          },
        },
      });

      return updatedBooking;
    });

    return cancelled;
  }
}
