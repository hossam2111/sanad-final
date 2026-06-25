import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const usersRouter = Router();

// Zod schemas for validation
const createUserSchema = z.object({
  nationalId: z.string().min(10).max(20),
  fullName: z.string().min(2).max(100),
  role: z.enum(["admin", "doctor", "lab", "pharmacy", "citizen"]),
  hospitalId: z.string().max(36).optional(),
  password: z.string().min(6), // We will just store it directly for this mock, in real world hash it.
});

// GET /api/users
usersRouter.get("/", async (req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      nationalId: usersTable.nationalId,
      fullName: usersTable.fullName,
      role: usersTable.role,
      hospitalId: usersTable.hospitalId,
      createdAt: usersTable.createdAt,
    }).from(usersTable);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users
usersRouter.post("/", async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid data", details: parsed.error.format() });
    }
    
    const data = parsed.data;
    const newId = crypto.randomUUID(); // Node 19+ has crypto globally, or we can use a basic random string if it fails.

    // Check if user exists
    const existing = await db.select().from(usersTable).where(eq(usersTable.nationalId, data.nationalId)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "User with this National ID already exists" });
    }

    const [newUser] = await db.insert(usersTable).values({
      id: newId,
      nationalId: data.nationalId,
      fullName: data.fullName,
      role: data.role,
      hospitalId: data.hospitalId,
      passwordHash: data.password, // Storing raw for demo purposes
    }).returning();

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// DELETE /api/users/:id
usersRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});
