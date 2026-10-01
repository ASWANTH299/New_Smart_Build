import { Router } from "express";
import { issueController } from "./issue.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createIssueSchema,
  updateIssueSchema,
  resolveIssueSchema,
} from "./issue.validator.js";

export const issueRouter = Router({ mergeParams: true });

issueRouter.use(authenticate);

// Get list of issues for project with filters
issueRouter.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => issueController.getIssuesByProject(req, res, next)
);

// Report site issue
issueRouter.post(
  "/",
  requireProjectAccess("projectId"),
  validateRequest(createIssueSchema),
  (req, res, next) => issueController.createIssue(req, res, next)
);

// Get issue detail
issueRouter.get(
  "/:issueId",
  requireProjectAccess("projectId"),
  (req, res, next) => issueController.getIssueById(req, res, next)
);

// Update issue status / details / assignee
issueRouter.patch(
  "/:issueId",
  requireProjectAccess("projectId"),
  validateRequest(updateIssueSchema),
  (req, res, next) => issueController.updateIssue(req, res, next)
);

issueRouter.put(
  "/:issueId",
  requireProjectAccess("projectId"),
  validateRequest(updateIssueSchema),
  (req, res, next) => issueController.updateIssue(req, res, next)
);

// Resolve issue with notes
issueRouter.patch(
  "/:issueId/resolve",
  requireProjectAccess("projectId"),
  validateRequest(resolveIssueSchema),
  (req, res, next) => issueController.resolveIssue(req, res, next)
);

// Close issue
issueRouter.patch(
  "/:issueId/close",
  requireProjectAccess("projectId"),
  (req, res, next) => issueController.closeIssue(req, res, next)
);

export default issueRouter;
