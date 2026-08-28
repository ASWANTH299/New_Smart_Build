import { Router } from "express";
import userController from "./user.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserPermissionsSchema,
  assignProjectSchema,
} from "./user.validator.js";

const router = Router();

// Authenticate all user management routes
router.use(authenticate);

// User read routes (Admin and Project Manager)
router.get("/", requireRoles("ADMIN", "PROJECT_MANAGER"), (req, res, next) =>
  userController.getUsers(req, res, next)
);

router.get("/:userId", requireRoles("ADMIN", "PROJECT_MANAGER"), (req, res, next) =>
  userController.getUserById(req, res, next)
);

// User mutation routes (Strictly ADMIN only)
router.post("/", requireRoles("ADMIN"), validateRequest(createUserSchema), (req, res, next) =>
  userController.createUser(req, res, next)
);

router.put("/:userId", requireRoles("ADMIN"), validateRequest(updateUserSchema), (req, res, next) =>
  userController.updateUser(req, res, next)
);

router.put(
  "/:userId/status",
  requireRoles("ADMIN"),
  validateRequest(updateUserStatusSchema),
  (req, res, next) => userController.updateUserStatus(req, res, next)
);

router.put(
  "/:userId/permissions",
  requireRoles("ADMIN"),
  validateRequest(updateUserPermissionsSchema),
  (req, res, next) => userController.updateUserPermissions(req, res, next)
);

router.post(
  "/:userId/projects",
  requireRoles("ADMIN"),
  validateRequest(assignProjectSchema),
  (req, res, next) => userController.assignProject(req, res, next)
);

router.delete("/:userId/projects/:projectId", requireRoles("ADMIN"), (req, res, next) =>
  userController.removeProjectAssignment(req, res, next)
);

export default router;
