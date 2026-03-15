import * as express from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import prisma from "../prisma/client";

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Promise.reject(new Error("No credentials provided"));
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub }
      });

      if (!user) {
        return Promise.reject(new Error("Invalid token"));
      }

      // If scopes are defined on the endpoint, check the user's role
      if (scopes && scopes.length > 0) {
        if (!scopes.includes(user.role)) {
          return Promise.reject(new Error(`Role not authorized. Required: ${scopes.join(" or ")}`));
        }
      }

      // Attach user to req.user for controllers
      request.user = { sub: user.id, email: user.email, role: user.role };
      return Promise.resolve(request.user);
    } catch (error) {
      return Promise.reject(new Error("Invalid token"));
    }
  }

  return Promise.reject(new Error("Unsupported security scheme"));
}
