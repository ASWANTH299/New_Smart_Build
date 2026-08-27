import { Router } from "express";
import authController from "./auth.controller.js";
import { validateRequest } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  activateAccountSchema,
  changePasswordSchema,
} from "./auth.validator.js";

const router = Router();

// Public Authentication Endpoints
router.post("/login", validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);
router.post("/forgot-password", validateRequest(forgotPasswordSchema), (req, res, next) =>
  authController.forgotPassword(req, res, next)
);
router.post("/reset-password", validateRequest(resetPasswordSchema), (req, res, next) =>
  authController.resetPassword(req, res, next)
);
router.post("/activate-account", validateRequest(activateAccountSchema), (req, res, next) =>
  authController.activateAccount(req, res, next)
);

// Protected Authentication Endpoints
router.post("/logout", authenticate, (req, res, next) =>
  authController.logout(req, res, next)
);
router.put(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next)
);
router.get("/me", authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;
