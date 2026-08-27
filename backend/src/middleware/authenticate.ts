import { Request, Response, NextFunction } from "express";
import { verifyJwtToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/AppError.js";
import { UserModel, IUser } from "../modules/users/user.model.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or malformed.");
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError("Authentication token is empty.");
    }

    const decoded = verifyJwtToken(token);

    const user = await UserModel.findById(decoded.userId).exec();
    if (!user) {
      throw new UnauthorizedError("User account belonging to this token no longer exists.");
    }

    if (user.status === "DEACTIVATED") {
      throw new UnauthorizedError("Your account has been deactivated. Please contact your administrator.");
    }

    if (user.status === "LOCKED") {
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        throw new UnauthorizedError(
          `Your account is locked until ${user.accountLockedUntil.toISOString()}. Please contact support.`
        );
      }
    }

    if (user.status === "PENDING_ACTIVATION") {
      throw new UnauthorizedError("Your account is pending activation. Please activate your account first.");
    }

    // Check if password changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        throw new UnauthorizedError("Your password was recently changed. Please log in again.");
      }
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
