import { describe, it, expect } from "vitest";
import { generateJwtToken, verifyJwtToken } from "./jwt.js";
import { UnauthorizedError } from "./AppError.js";

describe("JWT Utilities", () => {
  it("should generate a valid JWT token and verify payload", () => {
    const payload = {
      userId: "usr-12345",
      email: "engineer@smartbuild.com",
      role: "SITE_ENGINEER",
    };

    const token = generateJwtToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const decoded = verifyJwtToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.exp).toBeDefined();
  });

  it("should throw UnauthorizedError when token is malformed or invalid", () => {
    expect(() => verifyJwtToken("invalid.token.structure")).toThrow(UnauthorizedError);
  });
});
