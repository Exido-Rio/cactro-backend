import { Request, Response, NextFunction } from "express";

/**
 * Role-based Authorization Middleware (Factory)
 * Usage: requireRole("ORGANIZER") or requireRole("CUSTOMER")
 * Must be used AFTER authMiddleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
      return;
    }

    next();
  };
}
