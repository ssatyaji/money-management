import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { userRoute } from "./routes/user-route";

export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: "Money Management API Documentation",
          version: "1.0.0",
          description: "API documentation for the Money Management backend project",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'UUID',
              description: 'Masukkan token sesi (UUID) yang didapatkan dari proses login'
            },
          },
        },
      },
    })
  )
  .decorate("db", db) // Inject Drizzle instance into request context
  .use(userRoute)
  .get("/", () => {
    return {
      status: "success",
      message: "Money Management API is running",
      timestamp: new Date().toISOString(),
      runtime: `Bun v${Bun.version}`,
    };
  });
