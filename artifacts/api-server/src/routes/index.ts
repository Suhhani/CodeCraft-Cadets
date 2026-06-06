import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import vendorsRouter from "./vendors";
import rfqsRouter from "./rfqs";
import quotationsRouter from "./quotations";
import approvalsRouter from "./approvals";
import purchaseOrdersRouter from "./purchase_orders";
import invoicesRouter from "./invoices";
import activityLogsRouter from "./activity_logs";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vendorsRouter);
router.use(rfqsRouter);
router.use(quotationsRouter);
router.use(approvalsRouter);
router.use(purchaseOrdersRouter);
router.use(invoicesRouter);
router.use(activityLogsRouter);
router.use(reportsRouter);

export default router;
