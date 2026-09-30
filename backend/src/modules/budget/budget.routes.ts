import { Router } from "express";
import { budgetController } from "./budget.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  updateBudgetSchema,
  recordExpenseSchema,
  updateExpenseSchema,
  createBudgetChangeRequestSchema,
  reviewBudgetChangeRequestSchema,
} from "./budget.validator.js";

// Router for /:projectId/budget
export const budgetRouter = Router({ mergeParams: true });

budgetRouter.use(authenticate);
budgetRouter.use(requireProjectAccess("projectId"));

budgetRouter.get("/summary", (req, res, next) =>
  budgetController.getBudgetSummary(req, res, next)
);

budgetRouter.put(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateBudgetSchema),
  (req, res, next) => budgetController.updateBudgetPlan(req, res, next)
);

// Router for /:projectId/expenses
export const expenseRouter = Router({ mergeParams: true });

expenseRouter.use(authenticate);
expenseRouter.use(requireProjectAccess("projectId"));

expenseRouter.get("/", (req, res, next) =>
  budgetController.getExpenses(req, res, next)
);

expenseRouter.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(recordExpenseSchema),
  (req, res, next) => budgetController.recordExpense(req, res, next)
);

expenseRouter.get("/:expenseId", (req, res, next) =>
  budgetController.getExpenseById(req, res, next)
);

expenseRouter.put(
  "/:expenseId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateExpenseSchema),
  (req, res, next) => budgetController.updateExpense(req, res, next)
);

expenseRouter.delete(
  "/:expenseId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => budgetController.deleteExpense(req, res, next)
);

// Router for /:projectId/budget-change-requests
export const budgetChangeRequestRouter = Router({ mergeParams: true });

budgetChangeRequestRouter.use(authenticate);
budgetChangeRequestRouter.use(requireProjectAccess("projectId"));

budgetChangeRequestRouter.get("/", (req, res, next) =>
  budgetController.getBudgetChangeRequests(req, res, next)
);

budgetChangeRequestRouter.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createBudgetChangeRequestSchema),
  (req, res, next) => budgetController.createBudgetChangeRequest(req, res, next)
);

budgetChangeRequestRouter.put(
  "/:requestId/review",
  requireRoles("ADMIN"),
  validateRequest(reviewBudgetChangeRequestSchema),
  (req, res, next) => budgetController.reviewBudgetChangeRequest(req, res, next)
);

export default {
  budgetRouter,
  expenseRouter,
  budgetChangeRequestRouter,
};
