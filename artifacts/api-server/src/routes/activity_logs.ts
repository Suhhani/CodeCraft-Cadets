import { Router } from "express";
import { db, activityLogsTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, getLocalUser } from "../lib/auth";

const router = Router();

router.get("/activity-logs", requireAuth, async (req, res) => {
  try {
    const { entityType, limit } = req.query as Record<string, string>;
    const limitNum = limit ? parseInt(limit) : 50;

    const logs = entityType
      ? await db.select().from(activityLogsTable)
          .where(eq(activityLogsTable.entityType, entityType))
          .orderBy(desc(activityLogsTable.createdAt))
          .limit(limitNum)
      : await db.select().from(activityLogsTable)
          .orderBy(desc(activityLogsTable.createdAt))
          .limit(limitNum);

    res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "listActivityLogs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const user = getLocalUser(req);
    if (!user) return res.json([]);

    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, user.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(20);

    res.json(notifications.map(n => ({
      ...n,
      isRead: n.isRead === "true",
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "listNotifications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [notification] = await db.update(notificationsTable)
      .set({ isRead: "true" })
      .where(eq(notificationsTable.id, id))
      .returning();

    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ ...notification, isRead: true, createdAt: notification.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "markNotificationRead error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
