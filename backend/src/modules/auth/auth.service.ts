import { UserModel, IUser } from "../users/user.model.js";
import { LoginHistoryModel } from "./loginHistory.model.js";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
} from "../../utils/password.js";
import { generateJwtToken } from "../../utils/jwt.js";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "../../utils/AppError.js";

import { getEffectivePermissions } from "./permissions.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  primaryRole: string;
  additionalPermissions: string[];
  effectivePermissions: string[];
  status: string;
  lastLoginAt?: Date | null;
}

export const sanitizeUser = (user: IUser): UserResponse => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  primaryRole: user.primaryRole,
  additionalPermissions: user.additionalPermissions || [],
  effectivePermissions: Array.from(getEffectivePermissions(user)),
  status: user.status,
  lastLoginAt: user.lastLoginAt,
});

export class AuthService {
  async login(
    email: string,
    pass: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ token: string; user: UserResponse }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).exec();

    // 1. User not found check
    if (!user) {
      await LoginHistoryModel.create({
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: "USER_NOT_FOUND",
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError("Invalid email or password.");
    }

    // 2. Check if account is currently locked
    if (user.status === "LOCKED") {
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        await LoginHistoryModel.create({
          userId: user._id,
          emailAttempted: normalizedEmail,
          success: false,
          failureReason: "ACCOUNT_LOCKED",
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedError(
          `Your account is locked until ${user.accountLockedUntil.toISOString()} due to excessive failed attempts.`
        );
      } else {
        // Lock period expired, reset status
        user.status = "ACTIVE";
        user.accountLockedUntil = null;
        user.failedLoginCount = 0;
      }
    }

    // 3. Deactivated account check
    if (user.status === "DEACTIVATED") {
      await LoginHistoryModel.create({
        userId: user._id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: "ACCOUNT_DEACTIVATED",
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError("Account has been deactivated. Please contact your administrator.");
    }

    // 4. Pending activation check
    if (user.status === "PENDING_ACTIVATION") {
      await LoginHistoryModel.create({
        userId: user._id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: "PENDING_ACTIVATION",
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError("Account is pending activation. Please activate your account first.");
    }

    // 5. Verify password
    const isMatch = await verifyPassword(pass, user.passwordHash);
    if (!isMatch) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      let failureReason = "INVALID_PASSWORD";

      if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
        user.status = "LOCKED";
        user.accountLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        failureReason = "ACCOUNT_LOCKED_FAILED_ATTEMPTS";
      }

      await user.save();

      await LoginHistoryModel.create({
        userId: user._id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason,
        ipAddress,
        userAgent,
      });

      if (user.status === "LOCKED") {
        throw new UnauthorizedError(
          "Account has been locked due to 5 consecutive failed login attempts. Please try again in 15 minutes."
        );
      }

      throw new UnauthorizedError("Invalid email or password.");
    }

    // 6. Successful login
    user.failedLoginCount = 0;
    user.accountLockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    await LoginHistoryModel.create({
      userId: user._id,
      emailAttempted: normalizedEmail,
      success: true,
      failureReason: null,
      ipAddress,
      userAgent,
    });

    const token = generateJwtToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.primaryRole,
    });

    return {
      token,
      user: sanitizeUser(user),
    };
  }

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).exec();

    if (!user || user.status === "DEACTIVATED") {
      // Return generic message to prevent email enumeration
      return {
        message: "If an account exists for this email, password reset instructions have been dispatched.",
      };
    }

    const rawToken = generateSecureToken();
    const hashed = hashToken(rawToken);

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // In V1 development/test, return resetToken for testing flows
    return {
      message: "If an account exists for this email, password reset instructions have been dispatched.",
      resetToken: rawToken,
    };
  }

  async resetPassword(rawToken: string, newPass: string): Promise<{ message: string }> {
    const hashed = hashToken(rawToken);
    const user = await UserModel.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).exec();

    if (!user) {
      throw new BadRequestError("Password reset token is invalid or has expired.");
    }

    const newHash = await hashPassword(newPass);
    user.passwordHash = newHash;
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginCount = 0;
    if (user.status === "LOCKED") {
      user.status = "ACTIVE";
      user.accountLockedUntil = null;
    }
    await user.save();

    return {
      message: "Password reset successfully. You may now log in with your new credentials.",
    };
  }

  async activateAccount(rawToken: string, newPass: string): Promise<{ message: string }> {
    const hashed = hashToken(rawToken);
    // Allow matching either hashed token or raw token (for simple invite codes)
    const user = await UserModel.findOne({
      $or: [{ activationToken: hashed }, { activationToken: rawToken }],
      activationExpires: { $gt: new Date() },
    }).exec();

    if (!user) {
      throw new BadRequestError("Activation token is invalid or has expired.");
    }

    const newHash = await hashPassword(newPass);
    user.passwordHash = newHash;
    user.status = "ACTIVE";
    user.activationToken = null;
    user.activationExpires = null;
    user.passwordChangedAt = new Date();
    await user.save();

    return {
      message: "Account activated successfully. You may now log in.",
    };
  }

  async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<{ message: string }> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const isMatch = await verifyPassword(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError("Current password is incorrect.");
    }

    user.passwordHash = await hashPassword(newPass);
    user.passwordChangedAt = new Date();
    await user.save();

    return {
      message: "Password updated successfully.",
    };
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return sanitizeUser(user);
  }
}

export const authService = new AuthService();
export default authService;
