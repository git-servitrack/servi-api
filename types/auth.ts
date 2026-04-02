import { z } from "zod";
import { userRoles } from "../config/constants";

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    middleName: z.string().max(50).optional(),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    avatar: z.string().url().optional(),
    role: z.enum(userRoles).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

export type RegisterRequest = z.infer<typeof registerSchema>["body"];
export type LoginRequest = z.infer<typeof loginSchema>["body"];

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: (typeof userRoles)[number];
}

export interface AuthResult {
  user: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    avatar: string | null;
    role: (typeof userRoles)[number];
  };
  accessToken: string;
  refreshToken: string;
}
