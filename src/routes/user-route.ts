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
      response: {
        200: t.Object({
          data: t.String()
        }),
        400: t.Object({
          error: t.String()
        })
      },
      detail: {
        tags: ["Users"],
        summary: "Registrasi akun baru",
        description: "Mendaftarkan akun pengguna baru dengan name, email, dan password.",
      },
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
      response: {
        200: t.Object({
          data: t.String()
        }),
        401: t.Object({
          error: t.String()
        })
      },
      detail: {
        tags: ["Authentication"],
        summary: "Login Pengguna",
        description: "Memasukkan email dan password untuk mendapatkan token sesi.",
      },
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
    },
    {
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            created_at: t.Any(),
          })
        }),
        401: t.Object({
          error: t.String()
        }),
        500: t.Object({
          error: t.String()
        })
      },
      detail: {
        tags: ["Users"],
        summary: "Dapatkan profil user",
        description: "Mendapatkan data profil user yang sedang login berdasarkan Bearer token (UUID) sesi aktif.",
        security: [{ bearerAuth: [] }],
      },
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
    },
    {
      response: {
        200: t.Object({
          data: t.String()
        }),
        401: t.Object({
          error: t.String()
        }),
        500: t.Object({
          error: t.String()
        })
      },
      detail: {
        tags: ["Authentication"],
        summary: "Logout",
        description: "Mengakhiri sesi pengguna aktif dengan menghapus token sesi (UUID) dari database.",
        security: [{ bearerAuth: [] }],
      },
    }
  );


