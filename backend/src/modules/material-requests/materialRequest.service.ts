import mongoose from "mongoose";
import MaterialRequestModel, {
  IMaterialRequest,
  MaterialRequestStatus,
} from "./materialRequest.model.js";
import MaterialModel from "../materials/material.model.js";
import inventoryService from "../inventory/inventory.service.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../utils/AppError.js";
import { logAuditAction } from "../audit/auditLog.model.js";

export interface GetMaterialRequestsFilter {
  status?: MaterialRequestStatus;
  requestedBy?: string;
  page?: number;
  limit?: number;
}

export class MaterialRequestService {
  private async generateRequestNumber(): Promise<string> {
    const count = await MaterialRequestModel.countDocuments();
    const year = new Date().getFullYear();
    return `MR-${year}-${String(count + 1).padStart(5, "0")}`;
  }

  async getMaterialRequests(
    projectId: string,
    filter: GetMaterialRequestsFilter = {}
  ): Promise<{
    requests: IMaterialRequest[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID format");
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.requestedBy && mongoose.Types.ObjectId.isValid(filter.requestedBy)) {
      query.requestedBy = new mongoose.Types.ObjectId(filter.requestedBy);
    }

    const [requests, total] = await Promise.all([
      MaterialRequestModel.find(query)
        .populate("requestedBy", "firstName lastName email")
        .populate("reviewedBy", "firstName lastName email")
        .populate("phaseId", "name")
        .populate("taskId", "title")
        .populate("items.materialId", "code name category unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MaterialRequestModel.countDocuments(query),
    ]);

    return {
      requests: requests as unknown as IMaterialRequest[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getMaterialRequestById(id: string): Promise<IMaterialRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid request ID format");
    }

    const request = await MaterialRequestModel.findById(id)
      .populate("requestedBy", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email")
      .populate("phaseId", "name")
      .populate("taskId", "title")
      .populate("items.materialId", "code name category unit unitPrice minimumStock reorderLevel")
      .exec();

    if (!request) {
      throw new NotFoundError("Material request not found");
    }

    return request;
  }

  async createMaterialRequest(
    projectId: string,
    data: {
      phaseId?: string;
      taskId?: string;
      reason: string;
      items: Array<{
        materialId: string;
        requestedQuantity: number;
        unit: string;
        notes?: string;
      }>;
      submitImmediately?: boolean;
    },
    actorId: string
  ): Promise<IMaterialRequest> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID format");
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError("Material request must contain at least one item");
    }

    // Validate materials
    for (const item of data.items) {
      if (!mongoose.Types.ObjectId.isValid(item.materialId)) {
        throw new BadRequestError(`Invalid material ID: ${item.materialId}`);
      }
      const material = await MaterialModel.findById(item.materialId).exec();
      if (!material) {
        throw new NotFoundError(`Material not found: ${item.materialId}`);
      }
      if (Number(item.requestedQuantity) <= 0) {
        throw new BadRequestError("Requested quantity must be greater than zero");
      }
    }

    const requestNumber = await this.generateRequestNumber();
    const status = data.submitImmediately ? "SUBMITTED" : "DRAFT";

    const request = await MaterialRequestModel.create({
      requestNumber,
      projectId: new mongoose.Types.ObjectId(projectId),
      requestedBy: new mongoose.Types.ObjectId(actorId),
      phaseId: data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : null,
      taskId: data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null,
      status,
      reason: data.reason,
      items: data.items.map((i) => ({
        materialId: new mongoose.Types.ObjectId(i.materialId),
        requestedQuantity: Number(i.requestedQuantity),
        approvedQuantity: 0,
        issuedQuantity: 0,
        unit: i.unit,
        notes: i.notes || "",
      })),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_REQUEST_CREATED",
      entityType: "MaterialRequest",
      entityId: request._id.toString(),
      projectId,
      metadata: { requestNumber, status, itemCount: request.items.length },
    });

    return request;
  }

  async submitMaterialRequest(id: string, actorId: string): Promise<IMaterialRequest> {
    const request = await this.getMaterialRequestById(id);

    if (request.status !== "DRAFT") {
      throw new BadRequestError(`Cannot submit request in status '${request.status}'`);
    }

    request.status = "SUBMITTED";
    await request.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_REQUEST_SUBMITTED",
      entityType: "MaterialRequest",
      entityId: request._id.toString(),
      projectId: request.projectId.toString(),
      metadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  async reviewMaterialRequest(
    id: string,
    data: {
      decision: "APPROVE" | "REJECT";
      rejectionReason?: string;
      approvedItems?: Array<{
        materialId: string;
        approvedQuantity: number;
      }>;
    },
    actorId: string
  ): Promise<IMaterialRequest> {
    const request = await this.getMaterialRequestById(id);

    if (request.status !== "SUBMITTED") {
      throw new BadRequestError(`Cannot review request in '${request.status}' status. Must be 'SUBMITTED'.`);
    }

    if (data.decision === "REJECT") {
      request.status = "REJECTED";
      request.reviewedBy = new mongoose.Types.ObjectId(actorId);
      request.reviewedAt = new Date();
      request.rejectionReason = data.rejectionReason || "Rejected by reviewer";
      await request.save();

      await logAuditAction({
        actorUserId: actorId,
        action: "MATERIAL_REQUEST_REJECTED",
        entityType: "MaterialRequest",
        entityId: request._id.toString(),
        projectId: request.projectId.toString(),
        metadata: { requestNumber: request.requestNumber, reason: request.rejectionReason },
      });

      return request;
    }

    // APPROVE flow
    request.status = "APPROVED";
    request.reviewedBy = new mongoose.Types.ObjectId(actorId);
    request.reviewedAt = new Date();

    const approvalMap = new Map<string, number>();
    if (data.approvedItems && data.approvedItems.length > 0) {
      data.approvedItems.forEach((i) => {
        approvalMap.set(i.materialId.toString(), Number(i.approvedQuantity));
      });
    }

    request.items.forEach((item) => {
      const matIdStr = item.materialId.toString();
      if (approvalMap.has(matIdStr)) {
        const approvedQty = approvalMap.get(matIdStr)!;
        if (approvedQty < 0) {
          throw new BadRequestError("Approved quantity cannot be negative");
        }
        if (approvedQty > item.requestedQuantity) {
          throw new BadRequestError(`Approved quantity cannot exceed requested quantity for item`);
        }
        item.approvedQuantity = approvedQty;
      } else {
        // Default to requested quantity if not explicitly provided
        item.approvedQuantity = item.requestedQuantity;
      }
    });

    await request.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_REQUEST_APPROVED",
      entityType: "MaterialRequest",
      entityId: request._id.toString(),
      projectId: request.projectId.toString(),
      metadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  async issueMaterialRequest(
    id: string,
    data: {
      locationId: string;
      items: Array<{
        materialId: string;
        quantityToIssue: number;
      }>;
      notes?: string;
    },
    actorId: string
  ): Promise<IMaterialRequest> {
    const request = await this.getMaterialRequestById(id);

    // Business Rule: Material issuance without required approval is strictly prohibited
    if (request.status !== "APPROVED" && request.status !== "PARTIALLY_ISSUED") {
      throw new ForbiddenError(
        `Material issuance prohibited: Request '${request.requestNumber}' is in status '${request.status}'. Only APPROVED requests can be issued.`
      );
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError("At least one item must be issued");
    }

    // Process each item issuance against inventory
    for (const issueItem of data.items) {
      const targetItem = request.items.find((i) => {
        const idStr = typeof i.materialId === "object" && i.materialId !== null && "_id" in i.materialId
          ? String((i.materialId as { _id: unknown })._id)
          : String(i.materialId);
        return idStr === issueItem.materialId;
      });

      if (!targetItem) {
        throw new NotFoundError(`Item with material ID ${issueItem.materialId} not found in this request`);
      }

      const remainingToIssue = targetItem.approvedQuantity - targetItem.issuedQuantity;
      const qtyToIssue = Number(issueItem.quantityToIssue);

      if (qtyToIssue <= 0) {
        throw new BadRequestError("Quantity to issue must be positive");
      }

      if (qtyToIssue > remainingToIssue) {
        throw new BadRequestError(
          `Cannot issue ${qtyToIssue}. Remaining approved quantity is ${remainingToIssue} ${targetItem.unit}.`
        );
      }

      // Decrement inventory stock and record ISSUE transaction
      await inventoryService.issueMaterials(
        {
          locationId: data.locationId,
          materialId: issueItem.materialId,
          quantity: qtyToIssue,
          referenceType: "MATERIAL_REQUEST",
          referenceId: request._id.toString(),
          projectId: request.projectId.toString(),
          reason: data.notes || `Issued for request ${request.requestNumber}`,
        },
        actorId
      );

      targetItem.issuedQuantity += qtyToIssue;
    }

    // Determine overall status
    const allFullyIssued = request.items.every((i) => i.issuedQuantity >= i.approvedQuantity);
    if (allFullyIssued) {
      request.status = "ISSUED";
      request.issuedAt = new Date();
    } else {
      request.status = "PARTIALLY_ISSUED";
    }

    await request.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_REQUEST_ISSUED",
      entityType: "MaterialRequest",
      entityId: request._id.toString(),
      projectId: request.projectId.toString(),
      metadata: {
        requestNumber: request.requestNumber,
        newStatus: request.status,
        locationId: data.locationId,
      },
    });

    return request;
  }

  async cancelMaterialRequest(id: string, actorId: string): Promise<IMaterialRequest> {
    const request = await this.getMaterialRequestById(id);

    if (request.status === "ISSUED" || request.status === "PARTIALLY_ISSUED") {
      throw new BadRequestError("Cannot cancel a request that has already been issued or partially issued");
    }

    if (request.status === "CANCELLED") {
      return request;
    }

    request.status = "CANCELLED";
    await request.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_REQUEST_CANCELLED",
      entityType: "MaterialRequest",
      entityId: request._id.toString(),
      projectId: request.projectId.toString(),
      metadata: { requestNumber: request.requestNumber },
    });

    return request;
  }
}

export const materialRequestService = new MaterialRequestService();
export default materialRequestService;
