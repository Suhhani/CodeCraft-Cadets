import { pgTable, text, serial, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const approvalEntityTypeEnum = pgEnum("approval_entity_type", ["rfq", "purchase_order", "quotation"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

export const approvalsTable = pgTable("approvals", {
  id: serial("id").primaryKey(),
  entityType: approvalEntityTypeEnum("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  entityTitle: text("entity_title").notNull(),
  requestedById: integer("requested_by_id").notNull(),
  requestedByName: text("requested_by_name").notNull(),
  approverId: integer("approver_id"),
  approverName: text("approver_name"),
  status: approvalStatusEnum("status").notNull().default("pending"),
  remarks: text("remarks"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  actionedAt: timestamp("actioned_at"),
});

export const insertApprovalSchema = createInsertSchema(approvalsTable).omit({ id: true, requestedAt: true });
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvalsTable.$inferSelect;
