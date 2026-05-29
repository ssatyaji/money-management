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
  );
