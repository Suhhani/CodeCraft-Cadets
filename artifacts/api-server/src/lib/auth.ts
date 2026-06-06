import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Attach clerkId
  (req as any).clerkId = clerkId;

  // Try to find the local user
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (user) {
    (req as any).localUser = user;
  }
  next();
};

export const getLocalUser = (req: Request) => (req as any).localUser as typeof usersTable.$inferSelect | undefined;
export const getClerkId = (req: Request) => (req as any).clerkId as string;
