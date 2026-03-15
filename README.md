# 🎫 Event Booking System — Backend API

A RESTful backend API for an Event Booking System built with **Express.js**, **TypeScript**, **Prisma**, and **PostgreSQL**.

## Features

- **Role-Based Access Control** — Two user roles: Event Organizer & Customer
- **Event Management** — Organizers create, update, and delete events
- **Ticket Booking** — Customers browse events and book tickets with atomic ticket management
- **Background Tasks** — Async job processing for booking confirmations and event update notifications
- **Input Validation** — Request validation using Zod schemas
- **JWT Authentication** — Secure token-based auth

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (REST)                        │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│  Express.js Server                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware Pipeline                                   │   │
│  │  CORS → JSON Parser → Auth (JWT) → Role Guard        │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │ Route Handlers                                        │   │
│  │  /api/auth     → AuthService                          │   │
│  │  /api/events   → EventsService                        │   │
│  │  /api/bookings → BookingsService                      │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼──────────┐  ┌─────────────────────────┐   │
│  │ Prisma ORM             │  │ In-Memory Job Queue      │   │
│  │ (PostgreSQL)            │  │  → Booking Confirmation  │   │
│  │                         │  │  → Event Notification    │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer           | Technology            | Why                                      |
|-----------------|----------------------|------------------------------------------|
| Runtime         | Node.js + TypeScript | Type safety, modern JS                   |
| Framework       | Express.js           | Lightweight, universally understood       |
| ORM             | Prisma               | Type-safe queries, easy migrations        |
| Database        | PostgreSQL           | Production-ready, deployable on Render    |
| Authentication  | JWT + bcrypt         | Stateless auth, secure password hashing   |
| Validation      | Zod                  | Runtime type validation with TS inference |
| Background Jobs | In-memory queue      | No Redis dependency, demonstrates pattern |

## Project Structure

```
src/
├── index.ts                         # Server entry point
├── app.ts                           # Express app setup & middleware
├── config/
│   └── env.ts                       # Environment configuration
├── middleware/
│   ├── auth.middleware.ts            # JWT token verification
│   ├── role.middleware.ts            # Role-based access control
│   ├── validate.middleware.ts        # Zod request body validation
│   └── error.middleware.ts           # Global error handler
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts            # POST /register, /login
│   │   ├── auth.service.ts           # Registration & login logic
│   │   └── auth.dto.ts               # Zod validation schemas
│   ├── events/
│   │   ├── events.routes.ts          # CRUD endpoints
│   │   ├── events.service.ts         # Event business logic
│   │   └── events.dto.ts             # Validation schemas
│   └── bookings/
│       ├── bookings.routes.ts        # Booking endpoints
│       ├── bookings.service.ts       # Booking logic + transactions
│       └── bookings.dto.ts           # Validation schemas
├── queue/
│   ├── job-queue.ts                  # In-memory async job queue
│   └── workers/
│       ├── booking-confirmation.worker.ts
│       └── event-notification.worker.ts
├── prisma/
│   └── client.ts                     # Prisma client singleton
└── utils/
    └── api-response.ts               # Response format helpers
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Render's free PostgreSQL)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate Prisma client & run migrations
npm run setup

# Start development server
npm run dev
```

### Environment Variables

| Variable      | Description                    | Example                                        |
|---------------|-------------------------------|------------------------------------------------|
| `DATABASE_URL`| PostgreSQL connection string  | `postgresql://user:pass@localhost:5432/eventdb` |
| `JWT_SECRET`  | Secret key for JWT signing     | `your-super-secret-key`                        |
| `PORT`        | Server port                    | `3000`                                         |

## API Reference

### Swagger UI Documentation
Interactive API documentation is available when the server is running:
- **URL**: `http://localhost:3000/api-docs`

This interface allows you to explore all endpoints, view request/response schemas, and test the API directly from your browser. To test authenticated endpoints, click the **"Authorize"** button at the top and paste your JWT token.

### Authentication
| Method | Endpoint             | Access | Description                  |
|--------|---------------------|--------|------------------------------|
| POST   | `/api/auth/register` | Public | Register (organizer/customer)|
| POST   | `/api/auth/login`    | Public | Login → JWT token            |

### Events
| Method | Endpoint           | Access           | Description                    |
|--------|-------------------|------------------|--------------------------------|
| POST   | `/api/events`      | Organizer        | Create event                   |
| GET    | `/api/events`      | Authenticated    | List events (?search=)         |
| GET    | `/api/events/:id`  | Authenticated    | Get event details              |
| PATCH  | `/api/events/:id`  | Organizer (owner)| Update → notifies customers    |
| DELETE | `/api/events/:id`  | Organizer (owner)| Delete event                   |

### Bookings
| Method | Endpoint             | Access   | Description                      |
|--------|---------------------|----------|----------------------------------|
| POST   | `/api/bookings`      | Customer | Book tickets → confirmation sent |
| GET    | `/api/bookings`      | Customer | List my bookings                 |
| GET    | `/api/bookings/:id`  | Customer | Get booking details              |
| DELETE | `/api/bookings/:id`  | Customer | Cancel → restores tickets        |

## API Usage Examples

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "password123",
    "name": "John Organizer",
    "role": "ORGANIZER"
  }'
```

### Create an Event (Organizer)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ORGANIZER_TOKEN>" \
  -d '{
    "title": "Tech Conference 2025",
    "description": "Annual tech conference",
    "location": "Convention Center",
    "date": "2025-12-15T09:00:00Z",
    "totalTickets": 500,
    "price": 49.99
  }'
```

### Book Tickets (Customer)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -d '{
    "eventId": "<EVENT_ID>",
    "numberOfTickets": 2
  }'
```

## Background Tasks

### Booking Confirmation
Triggered when a customer books tickets. Simulates sending a confirmation email:
```
📧 BOOKING CONFIRMATION EMAIL
To:       customer@example.com
Subject:  Booking Confirmed - Tech Conference 2025
  Booking ID:    abc-123
  Tickets:       2
  Total Price:   $99.98
```

### Event Update Notification
Triggered when an organizer updates an event. Notifies all booked customers:
```
🔔 EVENT UPDATE NOTIFICATIONS
Event:           Tech Conference 2025
Updated Fields:  location, date
  📨 Notification sent to customer1@example.com
  📨 Notification sent to customer2@example.com
```

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Framework | Express over NestJS | Simpler, shows raw logic without framework abstractions |
| Queue | In-memory over Bull/Redis | Zero external dependencies; same pattern, easy to swap |
| Validation | Zod over class-validator | Better TS inference, works without decorators |
| Transactions | Prisma interactive transactions | Ensures ticket counts stay consistent under concurrency |
| Auth | JWT (stateless) | Simple, scalable, no session store needed |

## Deployment (Render)

1. Create a PostgreSQL database on Render
2. Create a Web Service pointing to this repo
3. Set environment variables (`DATABASE_URL`, `JWT_SECRET`)
4. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
5. Start command: `npm run start`
