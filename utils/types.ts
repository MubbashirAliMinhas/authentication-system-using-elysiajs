import type { Role } from "@prisma/client"
import type { Context } from "elysia"

export type JWTPayload = {
  id: string,
  iat?: number,
  exp?: number
}

export type UserPayload = {
  id: string,
  name: string,
  role: Role,
  verified: boolean,
  iat: number,
  exp: number
}

export type VerificationPayload = {
  id: string,
  resetId: string
}

export interface UserPayloadContext extends Context {
  userPayload: UserPayload
}