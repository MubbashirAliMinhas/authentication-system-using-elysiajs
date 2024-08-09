import Elysia from "elysia";
import { apiModule } from "./api/api-module";
import cors from "@elysiajs/cors";

const PORT = 3000

const app = new Elysia()
  .use(cors())
  .use(apiModule)
  .listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })