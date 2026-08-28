import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { authService } from "../../services/authService.js";

describe("ProfilePage Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      "smart_build_user",
      JSON.stringify({
        id: "507f1f77bcf86cd799439001",
        name: "System Administrator",
        email: "admin@smartbuild.com",
        primaryRole: "ADMIN",
        status: "ACTIVE",
        effectivePermissions: ["projects:view", "users:manage"],
      })
    );
    localStorage.setItem("smart_build_token", "test-token");
  });

  it("renders profile details and submits password change", async () => {
    vi.spyOn(authService, "changePassword").mockResolvedValue({
      success: true,
      data: { message: "Password updated successfully" },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <ProfilePage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Account Profile")).toBeInTheDocument();
    expect(screen.getByText("admin@smartbuild.com")).toBeInTheDocument();
    expect(screen.getByText("projects:view")).toBeInTheDocument();

    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);

    fireEvent.change(currentPassInput, { target: { value: "Admin@123456" } });
    fireEvent.change(newPassInput, { target: { value: "NewAdmin@123456" } });
    fireEvent.change(confirmPassInput, { target: { value: "NewAdmin@123456" } });

    const submitBtn = screen.getByRole("button", { name: /Update Password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith("Admin@123456", "NewAdmin@123456");
    });
  });
});
