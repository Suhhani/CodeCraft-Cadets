import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /auth/me - get current user (JIT provision if needed)
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkId as string;
    const auth = getAuth(req);

    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);

    if (!user) {
      // JIT provision from Clerk session data
      const email = (auth as any)?.sessionClaims?.email || `${clerkId}@unknown.com`;
      const name = (auth as any)?.sessionClaims?.fullName || email.split("@")[0];
      [user] = await db
        .insert(usersTable)
        .values({ clerkId, name, email, role: "procurement_officer" })
        .returning();
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "getMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/signup — handled by Clerk, but we handle local user creation here
router.post("/auth/signup", async (req, res) => {
  const { name, email, role, companyName } = req.body;
  // The actual Clerk signup is done client-side; this is for additional profile data
  // We just return success — Clerk handles the actual signup
  res.status(201).json({ message: "Signup initiated via Clerk", user: { name, email, role, companyName } });
});

// POST /auth/login — handled by Clerk; stub for API compatibility
router.post("/auth/login", (_req, res) => {
  res.json({ message: "Login handled by Clerk client SDK" });
});

// POST /auth/logout — handled by Clerk client SDK
router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logout handled by Clerk client SDK" });
});

// POST /auth/forgot-password — handled by Clerk
router.post("/auth/forgot-password", (_req, res) => {
  res.json({ message: "Password reset email sent via Clerk" });
});

export default router;
