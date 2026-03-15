import express from "express";
import cors from "cors";

// Routes
import { RegisterRoutes } from "./routes";

// Middleware
import { errorMiddleware } from "./middleware/error.middleware";

// Background workers (register handlers)
import { jobQueue } from "./queue/job-queue";
import { bookingConfirmationHandler } from "./queue/workers/booking-confirmation.worker";
import { eventNotificationHandler } from "./queue/workers/event-notification.worker";

// Swagger
import swaggerUi from "swagger-ui-express";

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Event Booking System API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger Documentation ─────────────────────────────────────────
app.use(express.static("public"));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: "/swagger.json",
    },
  })
);

// ─── TSOA Auto-Generated Routes ────────────────────────────────────
RegisterRoutes(app);

// ─── Register Background Job Handlers ──────────────────────────────
jobQueue.register("booking-confirmation", bookingConfirmationHandler);
jobQueue.register("event-notification", eventNotificationHandler);

// ─── Global Error Handler (must be last) ───────────────────────────
app.use(errorMiddleware);

export default app;
