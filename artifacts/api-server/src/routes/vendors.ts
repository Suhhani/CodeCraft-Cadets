import { Router } from "express";
import { db, vendorsTable } from "@workspace/db";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { activityLogsTable } from "@workspace/db";

const router = Router();

router.get("/vendors", requireAuth, async (req, res) => {
  try {
    const { search, category, status } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (search) conditions.push(ilike(vendorsTable.companyName, `%${search}%`));
    if (category) conditions.push(eq(vendorsTable.category, category));
    if (status) conditions.push(eq(vendorsTable.status, status as any));

    const vendors = conditions.length
      ? await db.select().from(vendorsTable).where(and(...conditions))
      : await db.select().from(vendorsTable);

    res.json(vendors.map(v => ({ ...v, createdAt: v.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "listVendors error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/vendors", requireAuth, async (req, res) => {
  try {
    const { companyName, contactPerson, email, phone, address, gstNumber, category, status } = req.body;
    const [vendor] = await db.insert(vendorsTable).values({
      companyName, contactPerson, email, phone, address, gstNumber, category,
      status: status || "pending",
    }).returning();

    await db.insert(activityLogsTable).values({
      action: "created",
      entityType: "vendor",
      entityId: vendor.id,
      entityTitle: vendor.companyName,
      description: `Vendor ${vendor.companyName} registered`,
    });

    res.status(201).json({ ...vendor, createdAt: vendor.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "createVendor error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/vendors/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id)).limit(1);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json({ ...vendor, createdAt: vendor.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "getVendor error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/vendors/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { companyName, contactPerson, email, phone, address, gstNumber, category, status, rating } = req.body;
    const updateData: any = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;

    const [vendor] = await db.update(vendorsTable).set(updateData).where(eq(vendorsTable.id, id)).returning();
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json({ ...vendor, createdAt: vendor.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "updateVendor error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/vendors/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(vendorsTable).where(eq(vendorsTable.id, id));
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    req.log.error({ err }, "deleteVendor error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
