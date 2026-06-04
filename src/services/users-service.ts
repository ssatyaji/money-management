import { db } from "../db";
import { users, sessions } from "../db/schema";
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

  static async loginUser(payload: Pick<typeof users.$inferInsert, "email" | "password">) {
    // 1. Cari pengguna
    const user = await db.query.users.findFirst({
      where: eq(users.email, payload.email),
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    // 2. Verifikasi password
    const isPasswordValid = await Bun.password.verify(payload.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    // 3. Buat token UUID
    const token = crypto.randomUUID();

    // 4. Simpan sesi ke database
    await db.insert(sessions).values({
      token: token,
      userId: user.id,
    });

    return token;
  }

  static async getCurrentUser(token: string) {
    // 1. Cari sesi berdasarkan token
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    // 2. Cari user berdasarkan userId dari sesi
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    };
  }
}


