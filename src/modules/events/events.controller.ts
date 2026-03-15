import { Route, Post, Get, Patch, Delete, Body, Tags, Security, Request, Path, Query, SuccessResponse, Response } from "tsoa";
import { EventsService } from "./events.service";
import { CreateEventDto, UpdateEventDto, createEventDto, updateEventDto } from "./events.dto";
import * as express from "express";

@Route("api/events")
@Tags("Events")
export class EventsController {
  private eventsService = new EventsService();

  /**
   * Organizer only — Create a new event
   */
  @Post()
  @Security("jwt", ["ORGANIZER"])
  @SuccessResponse("201", "Event created successfully")
  @Response("403", "Forbidden (Organizer only)")
  public async create(
    @Request() request: express.Request,
    @Body() requestBody: CreateEventDto
  ): Promise<any> {
    const validatedBody = createEventDto.parse(requestBody);
    const event = await this.eventsService.create(request.user!.sub, validatedBody);
    return {
      success: true,
      message: "Event created successfully",
      data: event
    };
  }

  /**
   * Any authenticated user — List all events (optional ?search=keyword)
   */
  @Get()
  @Security("jwt")
  @SuccessResponse("200", "Events retrieved successfully")
  public async list(@Query() search?: string): Promise<any> {
    const events = await this.eventsService.findAll(search);
    return {
      success: true,
      message: "Events retrieved successfully",
      data: events
    };
  }

  /**
   * Any authenticated user — Get event details
   */
  @Get("{id}")
  @Security("jwt")
  @SuccessResponse("200", "Event retrieved successfully")
  @Response("404", "Event not found")
  public async get(@Path() id: string): Promise<any> {
    try {
      const event = await this.eventsService.findById(id);
      return {
        success: true,
        message: "Event retrieved successfully",
        data: event
      };
    } catch (error: any) {
      throw { status: 404, message: error.message };
    }
  }

  /**
   * Organizer only (owner) — Update event
   */
  @Patch("{id}")
  @Security("jwt", ["ORGANIZER"])
  @SuccessResponse("200", "Event updated successfully")
  @Response("403", "Forbidden (Owner only)")
  @Response("404", "Event not found")
  public async update(
    @Path() id: string,
    @Request() request: express.Request,
    @Body() requestBody: UpdateEventDto
  ): Promise<any> {
    try {
      const validatedBody = updateEventDto.parse(requestBody);
      const event = await this.eventsService.update(id, request.user!.sub, validatedBody);
      return {
        success: true,
        message: "Event updated successfully",
        data: event
      };
    } catch (error: any) {
      if (error.message === "Event not found") throw { status: 404, message: error.message };
      if (error.message === "You can only update your own events") throw { status: 403, message: error.message };
      throw { status: 400, message: error.message };
    }
  }

  /**
   * Organizer only (owner) — Delete event
   */
  @Delete("{id}")
  @Security("jwt", ["ORGANIZER"])
  @SuccessResponse("200", "Event deleted successfully")
  @Response("403", "Forbidden (Owner only)")
  @Response("404", "Event not found")
  public async delete(
    @Path() id: string,
    @Request() request: express.Request
  ): Promise<any> {
    try {
      const result = await this.eventsService.delete(id, request.user!.sub);
      return {
        success: true,
        message: "Event deleted successfully",
        data: result
      };
    } catch (error: any) {
      if (error.message === "Event not found") throw { status: 404, message: error.message };
      if (error.message === "You can only delete your own events") throw { status: 403, message: error.message };
      throw { status: 400, message: error.message };
    }
  }
}
