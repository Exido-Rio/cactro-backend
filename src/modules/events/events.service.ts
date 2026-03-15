import prisma from "../../prisma/client";
import { jobQueue } from "../../queue/job-queue";
import { CreateEventDto, UpdateEventDto } from "./events.dto";

/**
 * Events Service
 * Handles all event CRUD operations.
 * Only organizers (owners) can update/delete their own events.
 */
export class EventsService {
  /**
   * Create a new event
   * Sets availableTickets = totalTickets initially
   */
  async create(organizerId: string, dto: CreateEventDto) {
    const event = await prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        date: new Date(dto.date),
        totalTickets: dto.totalTickets,
        availableTickets: dto.totalTickets, // All tickets available initially
        price: dto.price,
        organizerId,
      },
    });
    return event;
  }

  /**
   * List all events (any authenticated user)
   * Supports optional search by title
   */
  async findAll(search?: string) {
    const where = search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return events;
  }

  /**
   * Get a single event by ID
   */
  async findById(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    return event;
  }

  /**
   * Update an event (organizer-owner only)
   * Triggers event-notification background job to notify booked customers
   */
  async update(eventId: string, organizerId: string, dto: UpdateEventDto) {
    // Check event exists and belongs to this organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("You can only update your own events");
    }

    // If totalTickets is being updated, adjust availableTickets accordingly
    const updateData: any = { ...dto };
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }
    if (dto.totalTickets !== undefined) {
      const ticketsDiff = dto.totalTickets - event.totalTickets;
      updateData.availableTickets = event.availableTickets + ticketsDiff;

      if (updateData.availableTickets < 0) {
        throw new Error(
          "Cannot reduce total tickets below the number of already booked tickets"
        );
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    // Trigger background notification to booked customers
    const updatedFields = Object.keys(dto);
    jobQueue.enqueue("event-notification", {
      eventId,
      eventTitle: updatedEvent.title,
      updatedFields,
    });

    return updatedEvent;
  }

  /**
   * Delete an event (organizer-owner only)
   */
  async delete(eventId: string, organizerId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("You can only delete your own events");
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return { message: "Event deleted successfully" };
  }
}
