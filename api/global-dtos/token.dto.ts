import { t } from "elysia";

export const TokenVerificationDTO = t.Object({
    authorization: t.String({
        pattern: '^bearer .+$'
    })
})