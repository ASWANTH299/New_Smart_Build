import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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

describe("Admin UsersPage & Access Requests Integration Tests", () => {
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
          effectivePermissions: [],
          status: "ACTIVE",
        },
      ],
    });

    renderComponent();

    expect(screen.getByText(/User & Access Management/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Amit Patel")).toBeInTheDocument();
      expect(screen.getByText("amit@smartbuild.com")).toBeInTheDocument();
    });
  });

  it("switches to Access Requests tab and displays pending access requests", async () => {
    vi.spyOn(userService, "getUsers").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(userService, "getAccessRequests").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "req-1",
          name: "Vikram Contractor",
          email: "vikram@contractor.com",
          requestedRole: "CONTRACTOR",
          organization: "Patel Steels",
          reason: "Reinforcement work",
          status: "PENDING",
          createdAt: "2026-08-20T10:00:00.000Z",
          updatedAt: "2026-08-20T10:00:00.000Z",
        },
      ],
    });

    renderComponent();

    const requestsTab = screen.getByRole("button", { name: /Access Requests/i });
    fireEvent.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText("Vikram Contractor")).toBeInTheDocument();
      expect(screen.getByText("vikram@contractor.com")).toBeInTheDocument();
      expect(screen.getByText("Org: Patel Steels")).toBeInTheDocument();
    });
  });

  it("approves pending access request and displays activation token", async () => {
    vi.spyOn(userService, "getUsers").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(userService, "getAccessRequests").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "req-1",
          name: "Vikram Contractor",
          email: "vikram@contractor.com",
          requestedRole: "CONTRACTOR",
          status: "PENDING",
          createdAt: "2026-08-20T10:00:00.000Z",
          updatedAt: "2026-08-20T10:00:00.000Z",
        },
      ],
    });

    vi.spyOn(userService, "approveAccessRequest").mockResolvedValueOnce({
      success: true,
      data: {
        accessRequest: {
          _id: "req-1",
          name: "Vikram Contractor",
          email: "vikram@contractor.com",
          requestedRole: "CONTRACTOR",
          status: "APPROVED",
          assignedRole: "CONTRACTOR",
          createdAt: "2026-08-20T10:00:00.000Z",
          updatedAt: "2026-08-20T10:00:00.000Z",
        },
        activationToken: "act-token-xyz-999",
      },
    });

    renderComponent();

    const requestsTab = screen.getByRole("button", { name: /Access Requests/i });
    fireEvent.click(requestsTab);

    const approveBtn = await screen.findByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    expect(screen.getByText(/Approve Access Request/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirm Approval/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(userService.approveAccessRequest).toHaveBeenCalledWith("req-1", {
        assignedRole: "CONTRACTOR",
      });
      expect(screen.getByText("Account Created (Pending Activation)")).toBeInTheDocument();
      expect(screen.getByDisplayValue("act-token-xyz-999")).toBeInTheDocument();
    });
  });

  it("opens safe delete confirmation dialog and deletes user account", async () => {
    vi.spyOn(userService, "getUsers").mockResolvedValue({
      success: true,
      data: [
        {
          id: "u-target-99",
          name: "Suresh Contractor",
          email: "suresh@vendor.com",
          primaryRole: "CONTRACTOR",
          additionalPermissions: [],
          effectivePermissions: [],
          status: "ACTIVE",
        },
      ],
    });

    vi.spyOn(userService, "deleteUser").mockResolvedValueOnce({
      success: true,
      data: {
        id: "u-target-99",
        name: "Suresh Contractor",
        email: "suresh@vendor.com",
        primaryRole: "CONTRACTOR",
        additionalPermissions: [],
        effectivePermissions: [],
        status: "DEACTIVATED",
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Suresh Contractor")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Deactivate & remove account");
    fireEvent.click(deleteBtn);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Deactivate & Remove Account" })).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Are you sure you want to remove the account for Suresh Contractor/i)
    ).toBeInTheDocument();

    const confirmDeleteBtn = within(dialog).getByRole("button", { name: /Deactivate & Remove Account/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith("u-target-99");
    });
  });
});
