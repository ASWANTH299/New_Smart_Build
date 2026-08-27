import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/index.js";
import { UnauthorizedError } from "./AppError.js";

export interface AuthJwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateJwtToken = (payload: Omit<AuthJwtPayload, "iat" | "exp">): string => {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
};

export const verifyJwtToken = (token: string): AuthJwtPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthJwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Session has expired. Please log in again.");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid authentication token.");
    }
    throw new UnauthorizedError("Authentication failed.");
  }
};
