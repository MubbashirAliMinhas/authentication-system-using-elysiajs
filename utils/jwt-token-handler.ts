import jwt, { TokenExpiredError } from "jsonwebtoken";
import type { UserPayload } from "./types";
import { t, type Context } from "elysia";
import { errorMessage } from "./error-handler";
import { environment } from "@/env/env";

export async function verifyAccessToken(
  c: Context,
): Promise<{ userPayload: UserPayload }> {
  const accessToken = c.cookie.access_token

  if (!accessToken.value) {
    throw errorMessage(401, "Authentication required.");
  }

  let payload
  try { 
    payload = jwt.verify(accessToken.value, environment.JWT_SECRET) as UserPayload
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw errorMessage(401, 'Session expired.')
    }

    throw errorMessage(401, 'Authentication required.')
  }

  return { userPayload: payload }
}
