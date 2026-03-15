import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client";
import { config } from "../../config/env";
import { RegisterDto, LoginDto } from "./auth.dto";

/**
 * Auth Service
 * Handles user registration and login with password hashing and JWT generation
 */
export class AuthService {
  /**
   * Register a new user
   * - Checks for duplicate email
   * - Hashes password with bcrypt
   * - Returns JWT token
   */
  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
      },
    });

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login an existing user
   * - Validates email and password
   * - Returns JWT token
   */
  async login(dto: LoginDto) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Generate a JWT token with user payload
   */
  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { sub: userId, email, role },
      config.jwtSecret,
      { expiresIn: "24h" }
    );
  }
}
