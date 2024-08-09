import { t } from "elysia";

export const EmailVerificationDTO = t.Object({
  email: t.String({
    format: 'email'
  })
})