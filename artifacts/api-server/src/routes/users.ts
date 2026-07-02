import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";
import { invalidateUserStatus } from "../middlewares/auth.js";

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
      status: usersTable.status,
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const [newUser] = await db.insert(usersTable).values({
      id: newId,
      nationalId: data.nationalId,
      fullName: data.fullName,
      role: data.role,
      hospitalId: data.hospitalId,
      passwordHash: hashedPassword,
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

// PUT /api/users/:id/status
usersRouter.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status !== "active" && status !== "revoked") {
      return res.status(400).json({ error: "Invalid status value. Must be 'active' or 'revoked'." });
    }

    const [updatedUser] = await db.update(usersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Drop the middleware's 60s status cache — revocation must bite on the very next request
    invalidateUserStatus(id!);

    const { ipAddress, userAgent } = extractRequestMeta(req);
    await writeAudit({
      who: (req as any).userId ?? (req as any).role ?? "admin", // use role or admin if user ID not parsed in this router
      whoRole: (req as any).role ?? "admin",
      action: "UPDATE",
      what: `Changed user ${id} status to ${status}`,
      ipAddress,
      userAgent,
      details: { userId: id, newStatus: status }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
});
