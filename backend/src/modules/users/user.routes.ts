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

// All user management routes require ADMIN role
router.use(authenticate, requireRoles("ADMIN"));

router.post("/", validateRequest(createUserSchema), (req, res, next) =>
  userController.createUser(req, res, next)
);

router.get("/", (req, res, next) => userController.getUsers(req, res, next));

router.get("/:userId", (req, res, next) =>
  userController.getUserById(req, res, next)
);

router.put("/:userId", validateRequest(updateUserSchema), (req, res, next) =>
  userController.updateUser(req, res, next)
);

router.put(
  "/:userId/status",
  validateRequest(updateUserStatusSchema),
  (req, res, next) => userController.updateUserStatus(req, res, next)
);

router.put(
  "/:userId/permissions",
  validateRequest(updateUserPermissionsSchema),
  (req, res, next) => userController.updateUserPermissions(req, res, next)
);

router.post(
  "/:userId/projects",
  validateRequest(assignProjectSchema),
  (req, res, next) => userController.assignProject(req, res, next)
);

router.delete("/:userId/projects/:projectId", (req, res, next) =>
  userController.removeProjectAssignment(req, res, next)
);

export default router;
