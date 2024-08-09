import { error } from "elysia";

export function errorMessage(status: number, message: string | Object) {
  if (typeof message == 'object') {
    return error(status, message)
  }
  return error(status, { message })
}