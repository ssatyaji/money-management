import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { userRoute } from "./routes/user-route";

const port = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Money Management API Documentation",
          version: "1.0.0",
          description: "API documentation for the Money Management backend project",
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
  })
  .listen(port);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📖 Swagger documentation is available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
