import { Route, Post, Body, Tags, SuccessResponse, Response } from "tsoa";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, registerDto, loginDto } from "./auth.dto";

@Route("api/auth")
@Tags("Auth")
export class AuthController {
  private authService = new AuthService();

  /**
   * Register a new user (organizer or customer)
   */
  @Post("register")
  @SuccessResponse("201", "User registered successfully")
  @Response("400", "Validation error")
  @Response("409", "User already exists")
  public async register(@Body() requestBody: RegisterDto): Promise<any> {
    const validatedBody = registerDto.parse(requestBody);
    const user = await this.authService.register(validatedBody);
    return {
      success: true,
      message: "User registered successfully",
      data: user
    };
  }

  /**
   * Login and receive a JWT token
   */
  @Post("login")
  @SuccessResponse("200", "Login successful")
  @Response("400", "Validation error")
  @Response("401", "Invalid email or password")
  public async login(@Body() requestBody: LoginDto): Promise<any> {
    const validatedBody = loginDto.parse(requestBody);
    const data = await this.authService.login(validatedBody);
    return {
      success: true,
      message: "Login successful",
      data
    };
  }
}
