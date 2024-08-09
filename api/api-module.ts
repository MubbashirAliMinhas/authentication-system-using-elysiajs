import Elysia from "elysia";
import { authModule } from "./auth/module";
import { forgotPasswordModule } from "./forgot-password/module";
import { verifyAccountModule } from "./verify-account/module";
import { testModule } from "./test-apis/module";

export const apiModule = new Elysia({ prefix: '/api' })
  .use(authModule)
  .use(forgotPasswordModule)
  .use(verifyAccountModule)
  .use(testModule)