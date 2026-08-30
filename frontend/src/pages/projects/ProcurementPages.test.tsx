import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProcurementRequestsPage } from "./ProcurementRequestsPage.js";
import { PurchaseOrdersPage } from "./PurchaseOrdersPage.js";
import { ReceivingPage } from "./ReceivingPage.js";
import { procurementService } from "../../services/procurementService.js";
import { materialService } from "../../services/materialService.js";
import { PurchaseOrder, Vendor, MaterialReceipt } from "../../types/procurement.js";

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

describe("Procurement Pages Integration Tests (Phase 9)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders ProcurementRequestsPage with request list", async () => {
    vi.spyOn(procurementService, "getProcurementRequests").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "pr1",
          requestNumber: "PR-2026-0001",
          projectId: "p1",
          reason: "Urgent foundation cement",
          status: "SUBMITTED",
          items: [],
          requestedBy: { _id: "u1", firstName: "Site", lastName: "Engineer", email: "eng@sb.com" },
          createdAt: "2026-08-30T00:00:00Z",
          updatedAt: "2026-08-30T00:00:00Z",
        },
      ],
    });
    vi.spyOn(materialService, "getMaterials").mockResolvedValue({ success: true, data: [] });

    render(
      <MemoryRouter initialEntries={["/projects/p1/procurement-requests"]}>
        <Routes>
          <Route path="/projects/:projectId/procurement-requests" element={<ProcurementRequestsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect((await screen.findAllByText("Procurement Requests")).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("PR-2026-0001")).toBeInTheDocument();
    expect(await screen.findByText("Urgent foundation cement")).toBeInTheDocument();
  });

  it("renders PurchaseOrdersPage with PO records", async () => {
    const mockVendor: Partial<Vendor> = {
      _id: "v1",
      code: "VEN-001",
      name: "Apex Steel Ltd",
    };

    const mockPO: Partial<PurchaseOrder> = {
      _id: "po1",
      poNumber: "PO-2026-0001",
      projectId: "p1",
      vendorId: mockVendor as Vendor,
      items: [],
      subtotal: 5000,
      tax: 500,
      total: 5500,
      approvalStatus: "APPROVED",
      status: "ISSUED",
      createdBy: { _id: "u1", firstName: "PM", lastName: "User", email: "pm@sb.com" },
      createdAt: "2026-08-30T00:00:00Z",
      updatedAt: "2026-08-30T00:00:00Z",
    };

    vi.spyOn(procurementService, "getPurchaseOrders").mockResolvedValue({
      success: true,
      data: [mockPO as PurchaseOrder],
    });
    vi.spyOn(procurementService, "getVendors").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(materialService, "getMaterials").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(procurementService, "getProcurementRequests").mockResolvedValue({ success: true, data: [] });

    render(
      <MemoryRouter initialEntries={["/projects/p1/purchase-orders"]}>
        <Routes>
          <Route path="/projects/:projectId/purchase-orders" element={<PurchaseOrdersPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Purchase Orders (PO)")).toBeInTheDocument();
    expect(await screen.findByText("PO-2026-0001")).toBeInTheDocument();
    expect(await screen.findByText("Apex Steel Ltd")).toBeInTheDocument();
    expect(await screen.findByText("$5500.00")).toBeInTheDocument();
  });

  it("renders ReceivingPage with goods receipts", async () => {
    const mockPO: Partial<PurchaseOrder> = { _id: "po1", poNumber: "PO-2026-0001" };
    const mockVendor: Partial<Vendor> = { _id: "v1", name: "Apex Steel Ltd" };

    const mockReceipt: Partial<MaterialReceipt> = {
      _id: "mr1",
      receiptNumber: "MR-2026-0001",
      projectId: "p1",
      purchaseOrderId: mockPO as PurchaseOrder,
      vendorId: mockVendor as Vendor,
      locationId: { _id: "loc1", name: "Central Warehouse", type: "CENTRAL_WAREHOUSE" },
      receivedBy: { _id: "u1", firstName: "Store", lastName: "Manager", email: "sm@sb.com" },
      receivedAt: "2026-08-30T00:00:00Z",
      items: [],
      createdAt: "2026-08-30T00:00:00Z",
      updatedAt: "2026-08-30T00:00:00Z",
    };

    vi.spyOn(procurementService, "getMaterialReceipts").mockResolvedValue({
      success: true,
      data: [mockReceipt as MaterialReceipt],
    });

    render(
      <MemoryRouter initialEntries={["/projects/p1/receiving"]}>
        <Routes>
          <Route path="/projects/:projectId/receiving" element={<ReceivingPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Material Receiving & Inspection Logs")).toBeInTheDocument();
    expect(await screen.findByText("MR-2026-0001")).toBeInTheDocument();
    expect(await screen.findByText("PO-2026-0001")).toBeInTheDocument();
  });
});
