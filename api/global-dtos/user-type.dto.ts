import { UserType } from "@prisma/client";
import { t } from "elysia";

export const UserTypeQueryDTO = t.Object({
  user_type: t.Enum(UserType)
})