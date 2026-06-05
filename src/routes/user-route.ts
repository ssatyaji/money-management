import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const userRoute = new Elysia()
  .derive(({ headers }) => ({
    getAuthToken: () => {
      const auth = headers["authorization"];
      if (!auth || !auth.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }
      const token = auth.split(" ")[1];
      if (!token) {
        throw new Error("Unauthorized");
      }
      return token;
    }
  }))
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
        name: t.String({ maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
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
  )
  .get(
    "/api/users/current",
    async ({ getAuthToken, set }) => {
      try {
        const token = getAuthToken();
        const user = await UsersService.getCurrentUser(token);
        return { data: user };
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    }
  )
  .delete(
    "/api/users/logout",
    async ({ getAuthToken, set }) => {
      try {
        const token = getAuthToken();
        await UsersService.logoutUser(token);
        return { data: "OK" };
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    }
  );


