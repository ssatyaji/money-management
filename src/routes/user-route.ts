import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const userRoute = new Elysia()
  .post(
    "/users/register",
    async ({ body, set }) => {
      try {
        await UsersService.registerUser(body);
        return { data: "Ok" };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/api/users/login",
    async ({ body, set }) => {
      try {
        const token = await UsersService.loginUser(body);
        return { data: token };
      } catch (error: any) {
        set.status = 401; // Unauthorized
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );

