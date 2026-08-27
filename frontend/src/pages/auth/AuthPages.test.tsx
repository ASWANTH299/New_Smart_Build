import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage.js";
import { ForgotPasswordPage } from "./ForgotPasswordPage.js";
import { ResetPasswordPage } from "./ResetPasswordPage.js";
import { ActivateAccountPage } from "./ActivateAccountPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{component}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe("Authentication Pages Integration Tests (Phase 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("LoginPage", () => {
    it("renders email and password inputs with submit button", () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    });

    it("toggles password visibility when eye icon is clicked", () => {
      renderWithProviders(<LoginPage />);
      const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");

      const toggleBtn = screen.getByLabelText(/Show password/i);
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe("text");

      const hideBtn = screen.getByLabelText(/Hide password/i);
      fireEvent.click(hideBtn);
      expect(passwordInput.type).toBe("password");
    });

    it("handles successful login submission and updates state", async () => {
      vi.spyOn(authService, "login").mockResolvedValueOnce({
        success: true,
        data: {
          token: "valid-jwt-token",
          user: {
            id: "u-1",
            name: "Rajesh Sharma",
            email: "rajesh@smartbuild.com",
            primaryRole: "PROJECT_MANAGER" as const,
            additionalPermissions: [],
            status: "ACTIVE" as const,
          },
        },
      });

      renderWithProviders(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: "rajesh@smartbuild.com" },
      });
      fireEvent.change(screen.getByLabelText(/^Password/i), {
        target: { value: "StrongPass123!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith("rajesh@smartbuild.com", "StrongPass123!");
        expect(localStorage.getItem("smart_build_token")).toBe("valid-jwt-token");
      });
    });
  });

  describe("ForgotPasswordPage", () => {
    it("submits email and displays confirmation message upon success", async () => {
      vi.spyOn(authService, "forgotPassword").mockResolvedValueOnce({
        success: true,
        data: { message: "Dispatched" },
      });

      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/Work Email Address/i), {
        target: { value: "engineer@smartbuild.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Send Reset Instructions/i }));

      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalledWith("engineer@smartbuild.com");
        expect(screen.getByText(/password reset link has been dispatched/i)).toBeInTheDocument();
      });
    });
  });

  describe("ResetPasswordPage", () => {
    it("submits new password and confirmation", async () => {
      vi.spyOn(authService, "resetPassword").mockResolvedValueOnce({
        success: true,
        data: { message: "Updated" },
      });

      renderWithProviders(<ResetPasswordPage />);

      const tokenInput = screen.getByLabelText(/Reset Token/i);
      const newPassInput = screen.getByLabelText(/^New Password/i);
      const confirmPassInput = screen.getByLabelText(/Confirm Password/i);

      fireEvent.change(tokenInput, { target: { value: "rst-token-123" } });
      fireEvent.change(newPassInput, { target: { value: "NewSecure123!" } });
      fireEvent.change(confirmPassInput, { target: { value: "NewSecure123!" } });

      fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

      await waitFor(() => {
        expect(authService.resetPassword).toHaveBeenCalledWith("rst-token-123", "NewSecure123!");
        expect(screen.getByText(/password has been updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe("ActivateAccountPage", () => {
    it("submits activation code and new password", async () => {
      vi.spyOn(authService, "activateAccount").mockResolvedValueOnce({
        success: true,
        data: { message: "Activated" },
      });

      renderWithProviders(<ActivateAccountPage />);

      fireEvent.change(screen.getByLabelText(/Activation Code/i), { target: { value: "ACT-123" } });
      fireEvent.change(screen.getByLabelText(/^Set Password/i), { target: { value: "InitialPass123!" } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "InitialPass123!" } });

      fireEvent.click(screen.getByRole("button", { name: /Activate Account/i }));

      await waitFor(() => {
        expect(authService.activateAccount).toHaveBeenCalledWith("ACT-123", "InitialPass123!");
      });
    });
  });
});
