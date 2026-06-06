import { Router } from "express";
import { db, rfqsTable, quotationsTable, vendorsTable, activityLogsTable } from "@workspace/db";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { requireAuth, getLocalUser } from "../lib/auth";
import { nextRfqNumber } from "../lib/counters";

const router = Router();

router.get("/rfqs", requireAuth, async (req, res) => {
  try {
    const { status, search } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(rfqsTable.status, status as any));
    if (search) conditions.push(ilike(rfqsTable.title, `%${search}%`));

    const rfqs = conditions.length
      ? await db.select().from(rfqsTable).where(and(...conditions))
      : await db.select().from(rfqsTable);

    res.json(rfqs.map(r => ({
      ...r,
      deadline: r.deadline.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "listRfqs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/rfqs", requireAuth, async (req, res) => {
  try {
    const user = getLocalUser(req);
    const { title, description, items, deadline, assignedVendorIds } = req.body;
    const [rfq] = await db.insert(rfqsTable).values({
      rfqNumber: nextRfqNumber(),
      title,
      description,
      items,
      deadline: new Date(deadline),
      assignedVendorIds: assignedVendorIds || [],
      createdById: user?.id || 0,
    }).returning();

    await db.insert(activityLogsTable).values({
      userId: user?.id,
      userName: user?.name,
      action: "created",
      entityType: "rfq",
      entityId: rfq.id,
      entityTitle: rfq.title,
      description: `RFQ ${rfq.rfqNumber} created: ${rfq.title}`,
    });

    res.status(201).json({ ...rfq, deadline: rfq.deadline.toISOString(), createdAt: rfq.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "createRfq error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rfqs/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rfq] = await db.select().from(rfqsTable).where(eq(rfqsTable.id, id)).limit(1);
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });
    res.json({ ...rfq, deadline: rfq.deadline.toISOString(), createdAt: rfq.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "getRfq error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/rfqs/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, items, deadline, status, assignedVendorIds } = req.body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (items !== undefined) updateData.items = items;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (status !== undefined) updateData.status = status;
    if (assignedVendorIds !== undefined) updateData.assignedVendorIds = assignedVendorIds;

    const [rfq] = await db.update(rfqsTable).set(updateData).where(eq(rfqsTable.id, id)).returning();
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });
    res.json({ ...rfq, deadline: rfq.deadline.toISOString(), createdAt: rfq.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "updateRfq error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/rfqs/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(rfqsTable).where(eq(rfqsTable.id, id));
    res.json({ message: "RFQ deleted" });
  } catch (err) {
    req.log.error({ err }, "deleteRfq error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /rfqs/:id/quotations/compare
router.get("/rfqs/:id/quotations/compare", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rfq] = await db.select().from(rfqsTable).where(eq(rfqsTable.id, id)).limit(1);
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });

    const quotations = await db.select().from(quotationsTable).where(eq(quotationsTable.rfqId, id));

    let lowestPriceVendorId: number | null = null;
    let fastestDeliveryVendorId: number | null = null;

    if (quotations.length > 0) {
      const lowestQ = quotations.reduce((min, q) => q.totalAmount < min.totalAmount ? q : min);
      lowestPriceVendorId = lowestQ.vendorId;

      // Parse delivery timelines to find fastest (simple heuristic: look for days)
      const parseDeliveryDays = (timeline: string): number => {
        const match = timeline.match(/(\d+)/);
        return match ? parseInt(match[1]) : 999;
      };
      const fastestQ = quotations.reduce((min, q) =>
        parseDeliveryDays(q.deliveryTimeline) < parseDeliveryDays(min.deliveryTimeline) ? q : min
      );
      fastestDeliveryVendorId = fastestQ.vendorId;
    }

    res.json({
      rfqId: rfq.id,
      rfqTitle: rfq.title,
      quotations: quotations.map(q => ({
        ...q,
        submittedAt: q.submittedAt.toISOString(),
      })),
      lowestPriceVendorId,
      fastestDeliveryVendorId,
    });
  } catch (err) {
    req.log.error({ err }, "compareQuotations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
