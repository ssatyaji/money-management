import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  /**
   * Mendaftarkan pengguna baru ke dalam sistem.
   * Melakukan pengecekan ketersediaan email, melakukan hashing pada password,
   * dan menyimpan data pengguna ke dalam database.
   *
   * @param payload Data pengguna baru yang berisi name, email, dan password.
   * @returns Indikator sukses { success: true } jika berhasil.
   * @throws Error jika email sudah digunakan.
   */
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

  /**
   * Melakukan proses autentikasi login pengguna.
   * Mengecek eksistensi email pengguna, memverifikasi kecocokan password,
   * dan membuat serta menyimpan token UUID untuk sesi pengguna tersebut.
   *
   * @param payload Objek yang berisi kredensial email dan password pengguna.
   * @returns String berupa token sesi (UUID) yang bisa digunakan untuk autentikasi API.
   * @throws Error jika email atau password tidak cocok.
   */
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

  /**
   * Mendapatkan detail profil pengguna saat ini berdasarkan token sesi.
   * Mengambil sesi berdasarkan token, lalu mencari profil pengguna terkait dari tabel users.
   *
   * @param token Token sesi (Bearer token) yang sedang digunakan oleh pengguna.
   * @returns Objek profil pengguna (id, name, email, created_at).
   * @throws Error "Unauthorized" jika token sesi tidak ditemukan atau tidak valid.
   */
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

  /**
   * Melakukan proses logout pengguna.
   * Mengakhiri sesi aktif dengan menghapus data token dari database.
   *
   * @param token Token sesi yang ingin dihapus.
   * @throws Error "Unauthorized" jika token tidak ditemukan / tidak ada record yang dihapus.
   */
  static async logoutUser(token: string) {
    const [result] = await db.delete(sessions).where(eq(sessions.token, token));
    if (result.affectedRows === 0) {
      throw new Error("Unauthorized");
    }
  }
}


