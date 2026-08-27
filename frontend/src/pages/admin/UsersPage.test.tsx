import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { UsersPage } from "./UsersPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { userService } from "../../services/userService.js";

const renderComponent = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <UsersPage />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );

describe("Admin UsersPage Integration Tests (Phase 6)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders user directory with loaded user records", async () => {
    vi.spyOn(userService, "getUsers").mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: "u-1",
          name: "Amit Patel",
          email: "amit@smartbuild.com",
          primaryRole: "PROJECT_MANAGER",
          additionalPermissions: [],
          status: "ACTIVE",
        },
      ],
    });

    renderComponent();

    expect(screen.getByText(/User & Organization Directory/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Amit Patel")).toBeInTheDocument();
      expect(screen.getByText("amit@smartbuild.com")).toBeInTheDocument();
    });
  });

  it("opens invite modal and submits new user invitation", async () => {
    vi.spyOn(userService, "getUsers").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(userService, "createUser").mockResolvedValueOnce({
      success: true,
      data: {
        user: {
          id: "u-2",
          name: "Sonia Verma",
          email: "sonia@smartbuild.com",
          primaryRole: "SITE_ENGINEER",
          additionalPermissions: [],
          status: "PENDING_ACTIVATION",
        },
        activationToken: "act-12345",
      },
    });

    renderComponent();

    const inviteBtn = screen.getByRole("button", { name: /Invite User/i });
    fireEvent.click(inviteBtn);

    expect(screen.getByText(/Onboard New Team Member/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Sonia Verma" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "sonia@smartbuild.com" },
    });

    const submitBtn = screen.getByRole("button", { name: /Create & Send Invitation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sonia Verma",
          email: "sonia@smartbuild.com",
        })
      );
    });
  });
});
