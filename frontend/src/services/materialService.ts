import apiClient, { ApiResponse } from "./api";
import {
  Material,
  BOM,
  BOMItem,
  MaterialRequest,
  InventoryLocation,
  InventoryBalance,
  InventoryTransaction,
  StockAlert,
} from "../types/material";

export interface GetMaterialsParams {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetBalancesParams {
  locationId?: string;
  materialId?: string;
  projectId?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export const materialService = {
  // --- Materials Catalog ---
  async getMaterials(params: GetMaterialsParams = {}): Promise<ApiResponse<Material[]>> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/materials${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<Material[]>(endpoint);
  },

  async getMaterialById(id: string): Promise<ApiResponse<Material>> {
    return apiClient.get<Material>(`/materials/${id}`);
  },

  async createMaterial(data: Partial<Material>): Promise<ApiResponse<Material>> {
    return apiClient.post<Material>("/materials", data);
  },

  async updateMaterial(id: string, data: Partial<Material>): Promise<ApiResponse<Material>> {
    return apiClient.put<Material>(`/materials/${id}`, data);
  },

  async getCategories(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>("/materials/categories");
  },

  // --- BOM (Bill of Materials) ---
  async getProjectBOMs(projectId: string): Promise<ApiResponse<BOM[]>> {
    return apiClient.get<BOM[]>(`/projects/${projectId}/bom`);
  },

  async getBOMById(projectId: string, bomId: string): Promise<ApiResponse<{ bom: BOM; items: BOMItem[] }>> {
    return apiClient.get<{ bom: BOM; items: BOMItem[] }>(`/projects/${projectId}/bom/${bomId}`);
  },

  async createBOM(projectId: string, data: { notes?: string; phaseId?: string; taskId?: string }): Promise<ApiResponse<{ bom: BOM; items: BOMItem[] }>> {
    return apiClient.post<{ bom: BOM; items: BOMItem[] }>(`/projects/${projectId}/bom`, data);
  },

  async addBOMItem(projectId: string, bomId: string, item: { materialId: string; plannedQuantity: number; unit?: string; unitCost?: number; notes?: string }): Promise<ApiResponse<BOMItem>> {
    return apiClient.post<BOMItem>(`/projects/${projectId}/bom/${bomId}/items`, item);
  },

  async updateBOMItem(projectId: string, bomId: string, itemId: string, data: Partial<BOMItem>): Promise<ApiResponse<BOMItem>> {
    return apiClient.put<BOMItem>(`/projects/${projectId}/bom/${bomId}/items/${itemId}`, data);
  },

  async deleteBOMItem(projectId: string, bomId: string, itemId: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/projects/${projectId}/bom/${bomId}/items/${itemId}`);
  },

  async approveBOM(projectId: string, bomId: string, notes?: string): Promise<ApiResponse<BOM>> {
    return apiClient.post<BOM>(`/projects/${projectId}/bom/${bomId}/approve`, { notes });
  },

  // --- Material Requests ---
  async getMaterialRequests(projectId: string, params: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<MaterialRequest[]>> {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/projects/${projectId}/material-requests${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<MaterialRequest[]>(endpoint);
  },

  async getMaterialRequestById(projectId: string, id: string): Promise<ApiResponse<MaterialRequest>> {
    return apiClient.get<MaterialRequest>(`/projects/${projectId}/material-requests/${id}`);
  },

  async createMaterialRequest(
    projectId: string,
    data: {
      phaseId?: string;
      taskId?: string;
      reason: string;
      submitImmediately?: boolean;
      items: Array<{ materialId: string; requestedQuantity: number; unit: string; notes?: string }>;
    }
  ): Promise<ApiResponse<MaterialRequest>> {
    return apiClient.post<MaterialRequest>(`/projects/${projectId}/material-requests`, data);
  },

  async submitMaterialRequest(projectId: string, id: string): Promise<ApiResponse<MaterialRequest>> {
    return apiClient.put<MaterialRequest>(`/projects/${projectId}/material-requests/${id}/submit`);
  },

  async reviewMaterialRequest(
    projectId: string,
    id: string,
    data: {
      decision: "APPROVE" | "REJECT";
      rejectionReason?: string;
      approvedItems?: Array<{ materialId: string; approvedQuantity: number }>;
    }
  ): Promise<ApiResponse<MaterialRequest>> {
    return apiClient.put<MaterialRequest>(`/projects/${projectId}/material-requests/${id}/review`, data);
  },

  async issueMaterialRequest(
    projectId: string,
    id: string,
    data: {
      locationId: string;
      items: Array<{ materialId: string; quantityToIssue: number }>;
      notes?: string;
    }
  ): Promise<ApiResponse<MaterialRequest>> {
    return apiClient.post<MaterialRequest>(`/projects/${projectId}/material-requests/${id}/issue`, data);
  },

  async cancelMaterialRequest(projectId: string, id: string): Promise<ApiResponse<MaterialRequest>> {
    return apiClient.put<MaterialRequest>(`/projects/${projectId}/material-requests/${id}/cancel`);
  },

  // --- Inventory Management ---
  async getLocations(projectId?: string): Promise<ApiResponse<InventoryLocation[]>> {
    const endpoint = projectId ? `/inventory/locations?projectId=${projectId}` : "/inventory/locations";
    return apiClient.get<InventoryLocation[]>(endpoint);
  },

  async createLocation(data: Partial<InventoryLocation>): Promise<ApiResponse<InventoryLocation>> {
    return apiClient.post<InventoryLocation>("/inventory/locations", data);
  },

  async getBalances(params: GetBalancesParams = {}): Promise<ApiResponse<InventoryBalance[]>> {
    const query = new URLSearchParams();
    if (params.locationId) query.append("locationId", params.locationId);
    if (params.materialId) query.append("materialId", params.materialId);
    if (params.projectId) query.append("projectId", params.projectId);
    if (params.lowStockOnly) query.append("lowStockOnly", "true");
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/inventory/balances${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<InventoryBalance[]>(endpoint);
  },

  async getStockAlerts(projectId?: string): Promise<ApiResponse<StockAlert[]>> {
    const endpoint = projectId ? `/inventory/alerts?projectId=${projectId}` : "/inventory/alerts";
    return apiClient.get<StockAlert[]>(endpoint);
  },

  async getTransactions(params: { locationId?: string; materialId?: string; projectId?: string; transactionType?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<InventoryTransaction[]>> {
    const query = new URLSearchParams();
    if (params.locationId) query.append("locationId", params.locationId);
    if (params.materialId) query.append("materialId", params.materialId);
    if (params.projectId) query.append("projectId", params.projectId);
    if (params.transactionType) query.append("transactionType", params.transactionType);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const endpoint = `/inventory/transactions${query.toString() ? `?${query.toString()}` : ""}`;
    return apiClient.get<InventoryTransaction[]>(endpoint);
  },

  async receiveMaterials(data: { locationId: string; materialId: string; quantity: number; unitCost?: number; referenceType?: string; referenceId?: string; projectId?: string; reason?: string }): Promise<ApiResponse<{ transaction: InventoryTransaction; balance: InventoryBalance }>> {
    return apiClient.post<{ transaction: InventoryTransaction; balance: InventoryBalance }>("/inventory/receive", data);
  },

  async issueMaterials(data: { locationId: string; materialId: string; quantity: number; referenceType?: string; referenceId?: string; projectId?: string; reason?: string }): Promise<ApiResponse<{ transaction: InventoryTransaction; balance: InventoryBalance }>> {
    return apiClient.post<{ transaction: InventoryTransaction; balance: InventoryBalance }>("/inventory/issue", data);
  },

  async transferMaterials(data: { fromLocationId: string; toLocationId: string; materialId: string; quantity: number; projectId?: string; reason?: string }): Promise<ApiResponse<{ outTransaction: InventoryTransaction; inTransaction: InventoryTransaction; fromBalance: InventoryBalance; toBalance: InventoryBalance }>> {
    return apiClient.post<{ outTransaction: InventoryTransaction; inTransaction: InventoryTransaction; fromBalance: InventoryBalance; toBalance: InventoryBalance }>("/inventory/transfer", data);
  },

  async adjustStock(data: { locationId: string; materialId: string; adjustedQuantity: number; adjustmentType?: "DELTA" | "SET_TOTAL"; reason: string; projectId?: string }): Promise<ApiResponse<{ transaction: InventoryTransaction; balance: InventoryBalance }>> {
    return apiClient.post<{ transaction: InventoryTransaction; balance: InventoryBalance }>("/inventory/adjust", data);
  },

  async returnMaterials(data: { locationId: string; materialId: string; quantity: number; referenceType?: string; referenceId?: string; projectId?: string; reason?: string }): Promise<ApiResponse<{ transaction: InventoryTransaction; balance: InventoryBalance }>> {
    return apiClient.post<{ transaction: InventoryTransaction; balance: InventoryBalance }>("/inventory/return", data);
  },

  async consumeMaterials(data: { locationId: string; materialId: string; quantity: number; projectId: string; taskId?: string; reason?: string }): Promise<ApiResponse<{ transaction: InventoryTransaction; balance: InventoryBalance }>> {
    return apiClient.post<{ transaction: InventoryTransaction; balance: InventoryBalance }>("/inventory/consume", data);
  },
};

export default materialService;
