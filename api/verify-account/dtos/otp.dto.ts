import { t } from "elysia";

export const OTPDTO = t.Object({
  otp: t.Uppercase(t.String())

})