import type { Role } from "@prisma/client";
import { errorMessage } from "./error-handler";
import type { UserPayloadContext } from "./types";

export function checkPermissions(permissions: string | string[], verified: boolean = true) {
  return (context: any) => {
    const c = context as UserPayloadContext

    if (verified && verified != c.userPayload.verified) {
      throw errorMessage(401, "Please verify your account.")
    }

    const role = c.userPayload.role
    if (typeof permissions == 'string') {
      permissions = [ permissions ]
    }
  
    const compareResult = permissions.some(permission => role.permissions.includes(permission))
  
    if (!compareResult) {
      throw errorMessage(401, 'Insufficient permission to access this resource.')
    } 
  }
}