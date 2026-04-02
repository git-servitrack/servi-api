import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { BadRequestError, NotFoundError } from "../helpers/errors";
import { UserModel } from "../models/userModel";
import { AuthRepository } from "../repositories/authRepository";
import { AuthResult, AuthTokenPayload, LoginRequest, RegisterRequest } from "../types/auth";

const SALT_ROUNDS = 10;

type SafeUser = AuthResult["user"];

// Purpose: Handle business logic for register/login/token generation.
export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(payload: RegisterRequest): Promise<AuthResult> {
    const existingUser = await this.authRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new BadRequestError("User already exists", "USER_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
    const createdUser = await this.authRepository.createUser({
      ...payload,
      password: hashedPassword,
    });

    return this.buildAuthResult(createdUser);
  }

  async login(payload: LoginRequest): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(payload.email, true);

    if (!user) {
      throw new BadRequestError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    return this.buildAuthResult(user);
  }

  async getMe(id: string): Promise<SafeUser> {
    const user = await this.authRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return this.toSafeUser(user);
  }

  private buildAuthResult(user: UserModel): AuthResult {
    const safeUser = this.toSafeUser(user);
    const tokenPayload: AuthTokenPayload = {
      sub: safeUser._id,
      email: safeUser.email,
      role: safeUser.role,
    };

    return {
      user: safeUser,
      accessToken: this.signToken(
        tokenPayload,
        env.ACCESS_TOKEN_SECRET,
        env.ACCESS_TOKEN_EXPIRES_IN,
      ),
      refreshToken: this.signToken(
        tokenPayload,
        env.REFRESH_TOKEN_SECRET,
        env.REFRESH_TOKEN_EXPIRES_IN,
      ),
    };
  }

  private signToken(payload: AuthTokenPayload, secret: string, expiresIn: string): string {
    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
  }

  private toSafeUser(user: UserModel): SafeUser {
    return {
      _id: user._id.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      email: user.email,
      avatar: user?.avatar || null,
      role: user.role,
    };
  }
}
