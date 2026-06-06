import { Router } from "express";
import { db, quotationsTable, activityLogsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import { requireAuth, getLocalUser } from "../lib/auth";

const router = Router();

router.get("/quotations", requireAuth, async (req, res) => {
  try {
    const { rfqId, vendorId, status } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (rfqId) conditions.push(eq(quotationsTable.rfqId, parseInt(rfqId)));
    if (vendorId) conditions.push(eq(quotationsTable.vendorId, parseInt(vendorId)));
    if (status) conditions.push(eq(quotationsTable.status, status as any));

    const quotations = conditions.length
      ? await db.select().from(quotationsTable).where(and(...conditions))
      : await db.select().from(quotationsTable);

    res.json(quotations.map(q => ({ ...q, submittedAt: q.submittedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "listQuotations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quotations", requireAuth, async (req, res) => {
  try {
    const user = getLocalUser(req);
    const { rfqId, vendorId, vendorName, items, totalAmount, deliveryTimeline, notes } = req.body;

    const [quotation] = await db.insert(quotationsTable).values({
      rfqId,
      vendorId,
      vendorName: vendorName || "Unknown Vendor",
      items,
      totalAmount,
      deliveryTimeline,
      notes,
    }).returning();

    await db.insert(activityLogsTable).values({
      userId: user?.id,
      userName: user?.name,
      action: "submitted",
      entityType: "quotation",
      entityId: quotation.id,
      entityTitle: `Quotation for RFQ #${rfqId}`,
      description: `Quotation submitted by ${quotation.vendorName} for RFQ #${rfqId}`,
    });

    res.status(201).json({ ...quotation, submittedAt: quotation.submittedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "createQuotation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quotations/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [quotation] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, id)).limit(1);
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    res.json({ ...quotation, submittedAt: quotation.submittedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "getQuotation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/quotations/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { items, totalAmount, deliveryTimeline, notes, status } = req.body;
    const updateData: any = {};
    if (items !== undefined) updateData.items = items;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (deliveryTimeline !== undefined) updateData.deliveryTimeline = deliveryTimeline;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const [quotation] = await db.update(quotationsTable).set(updateData).where(eq(quotationsTable.id, id)).returning();
    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    res.json({ ...quotation, submittedAt: quotation.submittedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "updateQuotation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
