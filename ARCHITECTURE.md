# Architecture Document

## Overview

The Event Booking System follows a **layered architecture** pattern with clear separation of concerns. Each layer has a single responsibility and communicates only with adjacent layers.

## System Flow

```
Request Flow:
─────────────────────────────────────────────────────────────

Client Request
    │
    ▼
┌─────────────────────┐
│  Express Middleware  │  CORS, JSON parsing
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Auth Middleware     │  JWT verification → attaches user to req
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Role Middleware     │  Checks user role (ORGANIZER/CUSTOMER)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Validation Layer    │  Zod schema validation on req.body
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Route Handler       │  Thin controller — delegates to service
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐      ┌──────────────────┐
│  Service Layer       │─────▶│  Job Queue        │
│  (Business Logic)    │      │  (Background)     │
└─────────┬───────────┘      └────────┬─────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐      ┌──────────────────┐
│  Prisma ORM          │      │  Workers          │
│  (Data Access)       │      │  (Console Logs)   │
└─────────┬───────────┘      └──────────────────┘
          │
          ▼
┌─────────────────────┐
│  PostgreSQL          │
└─────────────────────┘
```

## Data Models

### User
```
┌──────────────────────────────┐
│ User                         │
├──────────────────────────────┤
│ id         : UUID (PK)      │
│ email      : String (Unique) │
│ password   : String (hashed) │
│ name       : String          │
│ role       : ORGANIZER │ CUSTOMER │
│ createdAt  : DateTime        │
│ updatedAt  : DateTime        │
├──────────────────────────────┤
│ → events[]   (if ORGANIZER)  │
│ → bookings[] (if CUSTOMER)   │
└──────────────────────────────┘
```

### Event
```
┌──────────────────────────────┐
│ Event                        │
├──────────────────────────────┤
│ id               : UUID (PK)│
│ title            : String    │
│ description      : String    │
│ location         : String    │
│ date             : DateTime  │
│ totalTickets     : Int       │
│ availableTickets : Int       │
│ price            : Float     │
│ organizerId      : UUID (FK) │
│ createdAt        : DateTime  │
│ updatedAt        : DateTime  │
├──────────────────────────────┤
│ → organizer (User)           │
│ → bookings[]                 │
└──────────────────────────────┘
```

### Booking
```
┌──────────────────────────────┐
│ Booking                      │
├──────────────────────────────┤
│ id              : UUID (PK) │
│ numberOfTickets : Int        │
│ totalPrice      : Float      │
│ status          : CONFIRMED │ CANCELLED │
│ customerId      : UUID (FK)  │
│ eventId         : UUID (FK)  │
│ createdAt       : DateTime   │
│ updatedAt       : DateTime   │
├──────────────────────────────┤
│ → customer (User)            │
│ → event (Event)              │
└──────────────────────────────┘
```

## Key Design Decisions

### 1. Express.js over NestJS
**Choice:** Express.js with a modular folder structure

**Reasoning:** Express keeps the code transparent — every middleware, guard, and handler is explicitly written, making it easy for any Node.js developer to understand the logic without framework-specific knowledge. The modular folder structure (routes → service → DTO per module) mirrors the separation NestJS provides, but without the decorator/DI overhead.

**Trade-off:** In a production app, NestJS would provide better structure at scale with dependency injection, built-in testing utilities, and decorators. The patterns used here (service classes, middleware guards, validation) translate directly to NestJS.

### 2. In-Memory Job Queue over Bull/Redis
**Choice:** Custom in-memory queue using `setTimeout`

**Reasoning:** Demonstrates the producer-consumer pattern without requiring Redis as an external dependency. The same interface (`enqueue(jobName, data)` → handler) maps directly to Bull's API, making it trivial to swap in production.

**How it works:**
```
1. Service calls jobQueue.enqueue("booking-confirmation", data)
2. Queue logs the job and schedules it via setTimeout(handler, 0)
3. Handler executes asynchronously in the next event loop tick
4. Handler logs the simulated email/notification
```

**Trade-off:** No persistence, no retries, no concurrency control. In production, swap with Bull + Redis for:
- Job persistence across server restarts
- Automatic retries with backoff
- Concurrent worker processing
- Job scheduling and rate limiting

### 3. Transactional Ticket Management
**Choice:** Prisma interactive transactions for booking/cancellation

**Reasoning:** When a customer books tickets, we must:
1. Check available ticket count
2. Decrement the count
3. Create the booking record

These steps must be atomic — if step 3 fails, step 2 must roll back. Prisma's `$transaction()` ensures this.

```typescript
await prisma.$transaction(async (tx) => {
  // All operations in here are atomic
  const event = await tx.event.findUnique(...);
  await tx.event.update({ data: { availableTickets: { decrement: n } } });
  await tx.booking.create(...);
});
```

### 4. Role-Based Access via Middleware
**Choice:** Middleware factory pattern

**Reasoning:** Clean separation — the auth middleware extracts the user from JWT, and the role middleware checks permissions. Route files clearly show access control:

```typescript
router.post("/", requireRole("ORGANIZER"), validate(createEventDto), handler);
```

This reads like documentation: "POST / requires ORGANIZER role, validates body, then runs handler."

### 5. Zod over class-validator
**Choice:** Zod for runtime validation

**Reasoning:** Zod provides:
- TypeScript type inference (`z.infer<typeof schema>`)
- No decorators needed (works with plain objects)
- Composable schemas (partial, pick, merge)
- Better error messages out of the box

### 6. Ownership Validation
**Choice:** Service-level ownership checks (not middleware)

**Reasoning:** Checking if "this organizer owns this event" requires a database query. This is business logic, not a reusable middleware concern. Keeping it in the service layer makes it explicit and testable.

## Security Considerations

| Concern | Implementation |
|---------|---------------|
| Password Storage | bcrypt with salt rounds = 10 |
| Authentication | JWT with 24h expiration |
| Authorization | Role middleware + ownership checks |
| Input Validation | Zod schemas on all POST/PATCH |
| SQL Injection | Prisma parameterized queries |
| Error Exposure | Production hides error details |

## Scalability Notes

For production scaling, consider:

1. **Database**: Add indexes on `events.organizerId`, `bookings.customerId`, `bookings.eventId`
2. **Queue**: Replace in-memory queue with Bull + Redis
3. **Caching**: Add Redis cache for event listings
4. **Rate Limiting**: Add express-rate-limit to auth endpoints
5. **Logging**: Replace console.log with structured logging (winston/pino)
6. **Monitoring**: Add health check endpoints and metrics
