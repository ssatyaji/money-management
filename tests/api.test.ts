import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "../src/app";
import { db, poolConnection } from "../src/db";
import { users, sessions } from "../src/db/schema";

// Clean database helper
async function cleanDatabase() {
  // sessions must be deleted first due to foreign key constraints referencing users.id
  await db.delete(sessions);
  await db.delete(users);
}

describe("Money Management API Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await poolConnection.end();
  });

  // 1. Endpoint: GET / (Health Check)
  describe("GET / - Health Check", () => {
    it("should return 200 OK and health check details", async () => {
      const response = await app.handle(
        new Request("http://localhost/", {
          method: "GET",
        })
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("status", "success");
      expect(body).toHaveProperty("message", "Money Management API is running");
      expect(body).toHaveProperty("timestamp");
      expect(body).toHaveProperty("runtime");
    });
  });

  // 2. Endpoint: POST /users/register (Registrasi)
  describe("POST /users/register - Registration", () => {
    it("should register a new user successfully with valid payload", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ data: "Ok" });
    });

    it("should return validation error for incomplete payload (missing email)", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            password: "securepassword123",
          }),
        })
      );
      // Elysia's schema validator typically returns 400 or 422 for bad requests
      expect([400, 422]).toContain(response.status);
    });

    it("should return validation error for name parameter exceeding 255 characters", async () => {
      const longName = "a".repeat(256);
      const response = await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: longName,
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
      expect([400, 422]).toContain(response.status);
    });

    it("should return 400 for duplicate email registration", async () => {
      // First registration
      const res1 = await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
      expect(res1.status).toBe(200);

      // Second registration with same email
      const res2 = await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Clone",
            email: "john@example.com",
            password: "anotherpassword123",
          }),
        })
      );
      expect(res2.status).toBe(400);

      const body = await res2.json();
      expect(body).toEqual({ error: "Email sudah terdaftar" });
    });
  });

  // 3. Endpoint: POST /api/users/login (Login)
  describe("POST /api/users/login - Login", () => {
    beforeEach(async () => {
      // Register a user to log in with
      await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
    });

    it("should log in successfully with valid credentials and return a token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("data");
      expect(typeof body.data).toBe("string");
    });

    it("should return 401 Unauthorized for unregistered email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "unregistered@example.com",
            password: "securepassword123",
          }),
        })
      );
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: "Email atau password salah" });
    });

    it("should return 401 Unauthorized for registered email but wrong password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "john@example.com",
            password: "wrongpassword123",
          }),
        })
      );
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: "Email atau password salah" });
    });
  });

  // 4. Endpoint: GET /api/users/current (Dapatkan User Saat Ini)
  describe("GET /api/users/current - Get Current User", () => {
    let validToken: string;

    beforeEach(async () => {
      // 1. Register
      await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );

      // 2. Login to get token
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
      const loginBody = await loginRes.json();
      validToken = loginBody.data;
    });

    it("should return 200 OK and user details for a valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("id");
      expect(body.data.name).toBe("John Doe");
      expect(body.data.email).toBe("john@example.com");
      expect(body.data).toHaveProperty("created_at");
    });

    it("should return 401 Unauthorized when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 Unauthorized when Authorization header does not use Bearer format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Basic ${validToken}`,
          },
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 Unauthorized for a non-existent session token", async () => {
      const randomToken = crypto.randomUUID();
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${randomToken}`,
          },
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  // 5. Endpoint: DELETE /api/users/logout (Logout)
  describe("DELETE /api/users/logout - Logout", () => {
    let validToken: string;

    beforeEach(async () => {
      // 1. Register
      await app.handle(
        new Request("http://localhost/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );

      // 2. Login to get token
      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "john@example.com",
            password: "securepassword123",
          }),
        })
      );
      const loginBody = await loginRes.json();
      validToken = loginBody.data;
    });

    it("should log out successfully, delete the session, and reject subsequent requests", async () => {
      // Logout request
      const logoutRes = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(logoutRes.status).toBe(200);
      const logoutBody = await logoutRes.json();
      expect(logoutBody).toEqual({ data: "OK" });

      // Verify token is no longer valid for getting current user
      const checkRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(checkRes.status).toBe(401);
    });

    it("should return 401 Unauthorized when logging out with an invalid/non-existent token", async () => {
      const randomToken = crypto.randomUUID();
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${randomToken}`,
          },
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });
});
