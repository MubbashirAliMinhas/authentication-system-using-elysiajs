import { t } from "elysia";

export const PasswordDTO = t.Object({
  password: t.String(),
  otp: t.Uppercase(t.String())
})