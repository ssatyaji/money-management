import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  static async registerUser(payload: typeof users.$inferInsert) {
    // 1. Validasi Ketersediaan Email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, payload.email),
    });

    if (existingUser) {
      throw new Error("Email sudah terdaftar");
    }

    // 2. Hashing Password menggunakan Bun.password (bcrypt)
    const passwordHash = await Bun.password.hash(payload.password, "bcrypt");

    // 3. Simpan ke database
    await db.insert(users).values({
      name: payload.name,
      email: payload.email,
      password: passwordHash,
    });

    return { success: true };
  }
}
