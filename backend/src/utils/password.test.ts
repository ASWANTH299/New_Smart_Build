import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
} from "./password.js";

describe("Password & Crypto Utilities", () => {
  it("should hash a password and verify it correctly", async () => {
    const rawPassword = "SecurePassword123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123!", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should generate a 64-character hex secure random token", () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it("should compute SHA-256 hash of a token deterministically", () => {
    const rawToken = "sample-token-string";
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
