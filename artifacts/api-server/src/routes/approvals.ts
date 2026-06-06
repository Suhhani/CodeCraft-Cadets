import { Router } from "express";
import { db, approvalsTable, activityLogsTable } from "@workspace/db";
import { eq, type SQL } from "drizzle-orm";
import { requireAuth, getLocalUser } from "../lib/auth";

const router = Router();

router.get("/approvals", requireAuth, async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;
    const approvals = status
      ? await db.select().from(approvalsTable).where(eq(approvalsTable.status, status as any))
      : await db.select().from(approvalsTable);

    res.json(approvals.map(a => ({
      ...a,
      requestedAt: a.requestedAt.toISOString(),
      actionedAt: a.actionedAt?.toISOString() || null,
    })));
  } catch (err) {
    req.log.error({ err }, "listApprovals error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/approvals/:id/approve", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = getLocalUser(req);
    const { remarks } = req.body;

    const [approval] = await db.update(approvalsTable)
      .set({
        status: "approved",
        remarks,
        approverId: user?.id || null,
        approverName: user?.name || null,
        actionedAt: new Date(),
      })
      .where(eq(approvalsTable.id, id))
      .returning();

    if (!approval) return res.status(404).json({ error: "Approval not found" });

    await db.insert(activityLogsTable).values({
      userId: user?.id,
      userName: user?.name,
      action: "approved",
      entityType: approval.entityType,
      entityId: approval.entityId,
      entityTitle: approval.entityTitle,
      description: `${approval.entityTitle} approved by ${user?.name || "system"}`,
    });

    res.json({
      ...approval,
      requestedAt: approval.requestedAt.toISOString(),
      actionedAt: approval.actionedAt?.toISOString() || null,
    });
  } catch (err) {
    req.log.error({ err }, "approveRequest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/approvals/:id/reject", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = getLocalUser(req);
    const { remarks } = req.body;

    const [approval] = await db.update(approvalsTable)
      .set({
        status: "rejected",
        remarks,
        approverId: user?.id || null,
        approverName: user?.name || null,
        actionedAt: new Date(),
      })
      .where(eq(approvalsTable.id, id))
      .returning();

    if (!approval) return res.status(404).json({ error: "Approval not found" });

    await db.insert(activityLogsTable).values({
      userId: user?.id,
      userName: user?.name,
      action: "rejected",
      entityType: approval.entityType,
      entityId: approval.entityId,
      entityTitle: approval.entityTitle,
      description: `${approval.entityTitle} rejected by ${user?.name || "system"}`,
    });

    res.json({
      ...approval,
      requestedAt: approval.requestedAt.toISOString(),
      actionedAt: approval.actionedAt?.toISOString() || null,
    });
  } catch (err) {
    req.log.error({ err }, "rejectRequest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
