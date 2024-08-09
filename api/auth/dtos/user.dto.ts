import { t } from "elysia"

export const UserDTO = t.Object({
  name: t.String(),
  email: t.String({
    format: 'email'
  }),
  password: t.String()
})

export const LoginUserDTO = t.Object({
  email: t.String({
    format: 'email'
  }),
  password: t.String()
})