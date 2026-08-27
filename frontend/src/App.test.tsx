import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";

describe("Application Shell & Navigation (Phase 3)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects unauthenticated user to /login by default", async () => {
    render(<App />);
    expect(screen.getByText(/Sign In to Your Workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
  });

  it("renders workspace branding and title", () => {
    render(<App />);
    expect(screen.getAllByText(/Smart Build/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders authenticated application shell when user is logged in", () => {
    localStorage.setItem("smart_build_token", "test-token");
    localStorage.setItem(
      "smart_build_user",
      JSON.stringify({
        id: "usr-1",
        name: "Vikram Engineer",
        email: "vikram@smartbuild.com",
        primaryRole: "PROJECT_MANAGER",
        additionalPermissions: [],
        status: "ACTIVE",
      })
    );

    render(<App />);
    expect(screen.getByText(/Operations Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Vikram Engineer/i).length).toBeGreaterThanOrEqual(1);
  });
});
