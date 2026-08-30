import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { VendorsPage } from "./VendorsPage.js";
import { procurementService } from "../../services/procurementService.js";
import { materialService } from "../../services/materialService.js";

vi.mock("../../services/procurementService.js");
vi.mock("../../services/materialService.js");
vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: "u1", primaryRole: "ADMIN" },
  }),
}));
vi.mock("../../hooks/useToast.js", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe("VendorsPage Integration Tests (Phase 9)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders vendor directory with supplier cards and details", async () => {
    vi.spyOn(procurementService, "getVendors").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "v1",
          code: "VEN-001",
          name: "Apex Steel Ltd",
          status: "ACTIVE",
          contact: { name: "John Doe", email: "john@apexsteel.com", phone: "+91-9876543210" },
          address: { city: "Hyderabad", country: "India" },
          performanceSummary: { rating: 4.8, totalOrders: 12, onTimeDeliveryRate: 98 },
          createdAt: "2026-08-30T00:00:00Z",
          updatedAt: "2026-08-30T00:00:00Z",
        },
      ],
    });

    vi.spyOn(materialService, "getMaterials").mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <BrowserRouter>
        <VendorsPage />
      </BrowserRouter>
    );

    expect(await screen.findByText("Vendor Directory")).toBeInTheDocument();
    expect(await screen.findByText("Apex Steel Ltd")).toBeInTheDocument();
    expect(await screen.findByText("VEN-001")).toBeInTheDocument();
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });
});
