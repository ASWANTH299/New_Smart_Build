import apiClient, { ApiResponse } from "./api.js";
import {
  Vendor,
  VendorStatus,
  ProcurementRequest,
  ProcurementRequestStatus,
  PurchaseOrder,
  POApprovalStatus,
  POStatus,
  MaterialReceipt,
} from "../types/procurement.js";

export const procurementService = {
  // ==========================================
  // Vendor Operations
  // ==========================================

  async getVendors(params: {
    search?: string;
    status?: VendorStatus;
    materialId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<Vendor[]>> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.materialId) query.append("materialId", params.materialId);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/vendors${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<Vendor[]>(endpoint);
  },

  async getVendorById(id: string): Promise<ApiResponse<Vendor>> {
    return apiClient.get<Vendor>(`/vendors/${id}`);
  },

  async createVendor(data: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    return apiClient.post<Vendor>("/vendors", data);
  },

  async updateVendor(id: string, data: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    return apiClient.put<Vendor>(`/vendors/${id}`, data);
  },

  // ==========================================
  // Procurement Requests
  // ==========================================

  async getProcurementRequests(
    projectId: string,
    params: {
      status?: ProcurementRequestStatus | string;
      requestedBy?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<ProcurementRequest[]>> {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.requestedBy) query.append("requestedBy", params.requestedBy);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/projects/${projectId}/procurement-requests${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<ProcurementRequest[]>(endpoint);
  },

  async getProcurementRequestById(
    projectId: string,
    id: string
  ): Promise<ApiResponse<ProcurementRequest>> {
    return apiClient.get<ProcurementRequest>(`/projects/${projectId}/procurement-requests/${id}`);
  },

  async createProcurementRequest(
    projectId: string,
    data: {
      reason: string;
      submitImmediately?: boolean;
      items: Array<{
        materialId: string;
        requestedQuantity: number;
        estimatedUnitPrice?: number;
        unit: string;
        notes?: string;
      }>;
    }
  ): Promise<ApiResponse<ProcurementRequest>> {
    return apiClient.post<ProcurementRequest>(`/projects/${projectId}/procurement-requests`, data);
  },

  async submitProcurementRequest(
    projectId: string,
    id: string
  ): Promise<ApiResponse<ProcurementRequest>> {
    return apiClient.put<ProcurementRequest>(
      `/projects/${projectId}/procurement-requests/${id}/submit`,
      {}
    );
  },

  async reviewProcurementRequest(
    projectId: string,
    id: string,
    data: { decision: "APPROVE" | "REJECT"; rejectionReason?: string }
  ): Promise<ApiResponse<ProcurementRequest>> {
    return apiClient.put<ProcurementRequest>(
      `/projects/${projectId}/procurement-requests/${id}/review`,
      data
    );
  },

  async cancelProcurementRequest(
    projectId: string,
    id: string
  ): Promise<ApiResponse<ProcurementRequest>> {
    return apiClient.put<ProcurementRequest>(
      `/projects/${projectId}/procurement-requests/${id}/cancel`,
      {}
    );
  },

  // ==========================================
  // Purchase Orders
  // ==========================================

  async getPurchaseOrders(
    projectId: string,
    params: {
      vendorId?: string;
      approvalStatus?: POApprovalStatus;
      status?: POStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<PurchaseOrder[]>> {
    const query = new URLSearchParams();
    if (params.vendorId) query.append("vendorId", params.vendorId);
    if (params.approvalStatus) query.append("approvalStatus", params.approvalStatus);
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/projects/${projectId}/purchase-orders${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<PurchaseOrder[]>(endpoint);
  },

  async getPurchaseOrderById(
    projectId: string,
    id: string
  ): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.get<PurchaseOrder>(`/projects/${projectId}/purchase-orders/${id}`);
  },

  async createPurchaseOrder(
    projectId: string,
    data: {
      procurementRequestId?: string;
      vendorId: string;
      expectedDeliveryDate?: string;
      tax?: number;
      notes?: string;
      termsAndConditions?: string;
      submitForApproval?: boolean;
      items: Array<{
        materialId: string;
        quantity: number;
        unit: string;
        unitPrice: number;
      }>;
    }
  ): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.post<PurchaseOrder>(`/projects/${projectId}/purchase-orders`, data);
  },

  async approvePurchaseOrder(
    projectId: string,
    id: string,
    data: { decision: "APPROVE" | "REJECT"; notes?: string }
  ): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.put<PurchaseOrder>(
      `/projects/${projectId}/purchase-orders/${id}/approve`,
      data
    );
  },

  async cancelPurchaseOrder(
    projectId: string,
    id: string
  ): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.put<PurchaseOrder>(
      `/projects/${projectId}/purchase-orders/${id}/cancel`,
      {}
    );
  },

  // ==========================================
  // Material Receipts & Receiving
  // ==========================================

  async getMaterialReceipts(
    projectId: string,
    params: {
      purchaseOrderId?: string;
      vendorId?: string;
      locationId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<MaterialReceipt[]>> {
    const query = new URLSearchParams();
    if (params.purchaseOrderId) query.append("purchaseOrderId", params.purchaseOrderId);
    if (params.vendorId) query.append("vendorId", params.vendorId);
    if (params.locationId) query.append("locationId", params.locationId);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/projects/${projectId}/receiving${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<MaterialReceipt[]>(endpoint);
  },

  async getMaterialReceiptById(
    projectId: string,
    id: string
  ): Promise<ApiResponse<MaterialReceipt>> {
    return apiClient.get<MaterialReceipt>(`/projects/${projectId}/receiving/${id}`);
  },

  async recordMaterialReceipt(
    projectId: string,
    data: {
      purchaseOrderId: string;
      locationId: string;
      invoiceNumber?: string;
      deliveryChallanNumber?: string;
      notes?: string;
      items: Array<{
        materialId: string;
        receivedQuantity: number;
        acceptedQuantity: number;
        rejectedQuantity?: number;
        rejectionReason?: string;
      }>;
    }
  ): Promise<ApiResponse<{ receipt: MaterialReceipt; purchaseOrder: PurchaseOrder }>> {
    return apiClient.post<{ receipt: MaterialReceipt; purchaseOrder: PurchaseOrder }>(
      `/projects/${projectId}/receiving`,
      data
    );
  },
};

export default procurementService;
