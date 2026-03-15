import { Route, Post, Get, Delete, Body, Tags, Security, Request, Path, SuccessResponse, Response } from "tsoa";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto, createBookingDto } from "./bookings.dto";
import * as express from "express";

@Route("api/bookings")
@Tags("Bookings")
export class BookingsController {
  private bookingsService = new BookingsService();

  /**
   * Customer only — Book tickets for an event
   */
  @Post()
  @Security("jwt", ["CUSTOMER"])
  @SuccessResponse("201", "Booking created successfully")
  @Response("400", "Not enough tickets available")
  @Response("404", "Event not found")
  public async create(
    @Request() request: express.Request,
    @Body() requestBody: CreateBookingDto
  ): Promise<any> {
    try {
      const validatedBody = createBookingDto.parse(requestBody);
      const booking = await this.bookingsService.create(
        request.user!.sub,
        request.user!.email,
        validatedBody
      );
      return {
        success: true,
        message: "Booking created successfully",
        data: booking
      };
    } catch (error: any) {
      if (error.message === "Event not found") throw { status: 404, message: error.message };
      if (error.message.includes("Not enough tickets")) throw { status: 400, message: error.message };
      throw { status: 500, message: error.message };
    }
  }

  /**
   * Customer only — List my bookings
   */
  @Get()
  @Security("jwt", ["CUSTOMER"])
  @SuccessResponse("200", "Bookings retrieved successfully")
  public async list(@Request() request: express.Request): Promise<any> {
    const bookings = await this.bookingsService.findAllByCustomer(request.user!.sub);
    return {
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings
    };
  }

  /**
   * Customer only — Get booking details (must own the booking)
   */
  @Get("{id}")
  @Security("jwt", ["CUSTOMER"])
  @SuccessResponse("200", "Booking retrieved successfully")
  @Response("403", "Forbidden (Owner only)")
  @Response("404", "Booking not found")
  public async get(
    @Path() id: string,
    @Request() request: express.Request
  ): Promise<any> {
    try {
      const booking = await this.bookingsService.findById(id, request.user!.sub);
      return {
        success: true,
        message: "Booking retrieved successfully",
        data: booking
      };
    } catch (error: any) {
      if (error.message === "Booking not found") throw { status: 404, message: error.message };
      if (error.message === "You can only view your own bookings") throw { status: 403, message: error.message };
      throw { status: 500, message: error.message };
    }
  }

  /**
   * Customer only — Cancel a booking (restores tickets)
   */
  @Delete("{id}")
  @Security("jwt", ["CUSTOMER"])
  @SuccessResponse("200", "Booking cancelled successfully")
  @Response("400", "Booking is already cancelled")
  @Response("403", "Forbidden (Owner only)")
  @Response("404", "Booking not found")
  public async cancel(
    @Path() id: string,
    @Request() request: express.Request
  ): Promise<any> {
    try {
      const result = await this.bookingsService.cancel(id, request.user!.sub);
      return {
        success: true,
        message: "Booking cancelled successfully",
        data: result
      };
    } catch (error: any) {
      if (error.message === "Booking not found") throw { status: 404, message: error.message };
      if (error.message === "You can only cancel your own bookings") throw { status: 403, message: error.message };
      if (error.message === "Booking is already cancelled") throw { status: 400, message: error.message };
      throw { status: 500, message: error.message };
    }
  }
}
