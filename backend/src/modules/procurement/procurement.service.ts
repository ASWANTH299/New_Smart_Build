import mongoose from "mongoose";
import ProcurementRequestModel, {
  IProcurementRequest,
  ProcurementRequestStatus,
} from "./procurementRequest.model.js";
import PurchaseOrderModel, {
  IPurchaseOrder,
  POApprovalStatus,
  POStatus,
} from "./purchaseOrder.model.js";
import MaterialReceiptModel, { IMaterialReceipt } from "./materialReceipt.model.js";
import VendorModel from "../vendors/vendor.model.js";
import MaterialModel from "../materials/material.model.js";
import inventoryService from "../inventory/inventory.service.js";
import { NotFoundError, BadRequestError } from "../../utils/AppError.js";
import { logAuditAction } from "../audit/auditLog.model.js";

export interface GetProcurementRequestsFilter {
  status?: ProcurementRequestStatus;
  requestedBy?: string;
  page?: number;
  limit?: number;
}

export interface GetPurchaseOrdersFilter {
  vendorId?: string;
  approvalStatus?: POApprovalStatus;
  status?: POStatus;
  page?: number;
  limit?: number;
}

export interface GetMaterialReceiptsFilter {
  purchaseOrderId?: string;
  vendorId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

export class ProcurementService {
  // Helper to generate sequential numbers
  private async generateNumber(prefix: string, model: { countDocuments: () => Promise<number> }): Promise<string> {
    const year = new Date().getFullYear();
    const count = await model.countDocuments();
    const seq = (count + 1).toString().padStart(4, "0");
    return `${prefix}-${year}-${seq}`;
  }

  // ==========================================
  // 1. Procurement Requests
  // ==========================================

  async getProcurementRequests(
    projectId: string,
    filter: GetProcurementRequestsFilter = {}
  ): Promise<{
    requests: IProcurementRequest[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID");
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.requestedBy && mongoose.Types.ObjectId.isValid(filter.requestedBy)) {
      query.requestedBy = new mongoose.Types.ObjectId(filter.requestedBy);
    }

    const [requests, total] = await Promise.all([
      ProcurementRequestModel.find(query)
        .populate("requestedBy", "firstName lastName email primaryRole")
        .populate("reviewedBy", "firstName lastName email")
        .populate("items.materialId", "code name category unit unitPrice")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ProcurementRequestModel.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getProcurementRequestById(id: string): Promise<IProcurementRequest> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid procurement request ID");
    }

    const request = await ProcurementRequestModel.findById(id)
      .populate("requestedBy", "firstName lastName email primaryRole")
      .populate("reviewedBy", "firstName lastName email")
      .populate("items.materialId", "code name category unit unitPrice minimumStock reorderLevel")
      .exec();

    if (!request) {
      throw new NotFoundError("Procurement request not found");
    }

    return request;
  }

  async createProcurementRequest(
    projectId: string,
    data: {
      reason: string;
      items: Array<{
        materialId: string;
        requestedQuantity: number;
        estimatedUnitPrice?: number;
        unit: string;
        notes?: string;
      }>;
      submitImmediately?: boolean;
    },
    actorId: string
  ): Promise<IProcurementRequest> {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID");
    }

    const requestNumber = await this.generateNumber("PR", ProcurementRequestModel);

    // Validate materials & calculate estimated prices
    const itemPromises = data.items.map(async (item) => {
      const mat = await MaterialModel.findById(item.materialId).exec();
      if (!mat) {
        throw new NotFoundError(`Material not found: ${item.materialId}`);
      }
      const unitPrice = Number(item.estimatedUnitPrice) || mat.unitPrice || 0;
      const qty = Number(item.requestedQuantity);
      return {
        materialId: mat._id,
        requestedQuantity: qty,
        estimatedUnitPrice: unitPrice,
        estimatedTotalPrice: Number((qty * unitPrice).toFixed(2)),
        unit: item.unit || mat.unit,
        notes: item.notes || "",
      };
    });

    const validatedItems = await Promise.all(itemPromises);

    const procurementRequest = new ProcurementRequestModel({
      requestNumber,
      projectId: new mongoose.Types.ObjectId(projectId),
      requestedBy: new mongoose.Types.ObjectId(actorId),
      reason: data.reason.trim(),
      items: validatedItems,
      status: data.submitImmediately ? "SUBMITTED" : "DRAFT",
    });

    await procurementRequest.save();

    await logAuditAction({
      action: "PROCUREMENT_REQUEST_CREATED",
      entityType: "ProcurementRequest",
      entityId: procurementRequest._id.toString(),
      actorUserId: actorId,
      projectId,
      metadata: {
        requestNumber: procurementRequest.requestNumber,
        status: procurementRequest.status,
        itemCount: procurementRequest.items.length,
      },
    });

    return procurementRequest;
  }

  async submitProcurementRequest(id: string, actorId: string): Promise<IProcurementRequest> {
    const request = await this.getProcurementRequestById(id);

    if (request.status !== "DRAFT") {
      throw new BadRequestError(`Only DRAFT procurement requests can be submitted. Current status: ${request.status}`);
    }

    request.status = "SUBMITTED";
    await request.save();

    await logAuditAction({
      action: "PROCUREMENT_REQUEST_SUBMITTED",
      entityType: "ProcurementRequest",
      entityId: request._id.toString(),
      actorUserId: actorId,
      projectId: request.projectId.toString(),
      metadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  async reviewProcurementRequest(
    id: string,
    data: { decision: "APPROVE" | "REJECT"; rejectionReason?: string },
    actorId: string
  ): Promise<IProcurementRequest> {
    const request = await this.getProcurementRequestById(id);

    if (request.status !== "SUBMITTED") {
      throw new BadRequestError(`Only SUBMITTED procurement requests can be reviewed. Current status: ${request.status}`);
    }

    if (data.decision === "APPROVE") {
      request.status = "APPROVED";
    } else {
      request.status = "REJECTED";
      request.rejectionReason = data.rejectionReason?.trim() || "Rejected by reviewer";
    }

    request.reviewedBy = new mongoose.Types.ObjectId(actorId);
    request.reviewedAt = new Date();

    await request.save();

    await logAuditAction({
      action: data.decision === "APPROVE" ? "PROCUREMENT_REQUEST_APPROVED" : "PROCUREMENT_REQUEST_REJECTED",
      entityType: "ProcurementRequest",
      entityId: request._id.toString(),
      actorUserId: actorId,
      projectId: request.projectId.toString(),
      metadata: { requestNumber: request.requestNumber, decision: data.decision },
    });

    return request;
  }

  async cancelProcurementRequest(id: string, actorId: string): Promise<IProcurementRequest> {
    const request = await this.getProcurementRequestById(id);

    if (request.status === "CONVERTED_TO_PO" || request.status === "CANCELLED") {
      throw new BadRequestError(`Cannot cancel request in '${request.status}' status`);
    }

    request.status = "CANCELLED";
    await request.save();

    await logAuditAction({
      action: "PROCUREMENT_REQUEST_CANCELLED",
      entityType: "ProcurementRequest",
      entityId: request._id.toString(),
      actorUserId: actorId,
      projectId: request.projectId.toString(),
      metadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  // ==========================================
  // 2. Purchase Orders
  // ==========================================

  async getPurchaseOrders(
    projectId: string,
    filter: GetPurchaseOrdersFilter = {}
  ): Promise<{
    purchaseOrders: IPurchaseOrder[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID");
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (filter.vendorId && mongoose.Types.ObjectId.isValid(filter.vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(filter.vendorId);
    }
    if (filter.approvalStatus) {
      query.approvalStatus = filter.approvalStatus;
    }
    if (filter.status) {
      query.status = filter.status;
    }

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrderModel.find(query)
        .populate("vendorId", "code name contact status")
        .populate("createdBy", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("items.materialId", "code name category unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      PurchaseOrderModel.countDocuments(query),
    ]);

    return {
      purchaseOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getPurchaseOrderById(id: string): Promise<IPurchaseOrder> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid purchase order ID");
    }

    const po = await PurchaseOrderModel.findById(id)
      .populate("vendorId", "code name contact address status")
      .populate("procurementRequestId", "requestNumber reason status")
      .populate("createdBy", "firstName lastName email primaryRole")
      .populate("approvedBy", "firstName lastName email")
      .populate("items.materialId", "code name category unit unitPrice")
      .exec();

    if (!po) {
      throw new NotFoundError("Purchase order not found");
    }

    return po;
  }

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
    },
    actorId: string
  ): Promise<IPurchaseOrder> {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID");
    }

    const vendor = await VendorModel.findById(data.vendorId).exec();
    if (!vendor) {
      throw new NotFoundError("Vendor not found");
    }
    if (vendor.status === "BLACKLISTED") {
      throw new BadRequestError("Cannot create purchase order with a blacklisted vendor");
    }

    let procurementRequest: IProcurementRequest | null = null;
    if (data.procurementRequestId) {
      procurementRequest = await ProcurementRequestModel.findById(data.procurementRequestId).exec();
      if (!procurementRequest) {
        throw new NotFoundError("Referenced procurement request not found");
      }
      if (procurementRequest.status !== "APPROVED") {
        throw new BadRequestError(
          `Cannot create PO from procurement request with status '${procurementRequest.status}'. Must be APPROVED.`
        );
      }
    }

    const poNumber = await this.generateNumber("PO", PurchaseOrderModel);

    let subtotal = 0;
    const validatedItems = await Promise.all(
      data.items.map(async (item) => {
        const mat = await MaterialModel.findById(item.materialId).exec();
        if (!mat) {
          throw new NotFoundError(`Material not found: ${item.materialId}`);
        }
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        const itemTotal = Number((qty * price).toFixed(2));
        subtotal += itemTotal;

        return {
          materialId: mat._id,
          quantity: qty,
          unit: item.unit || mat.unit,
          unitPrice: price,
          total: itemTotal,
          receivedQuantity: 0,
        };
      })
    );

    const tax = Number(data.tax) || 0;
    const total = Number((subtotal + tax).toFixed(2));
    const approvalStatus: POApprovalStatus = data.submitForApproval ? "PENDING_APPROVAL" : "DRAFT";

    const po = new PurchaseOrderModel({
      poNumber,
      procurementRequestId: procurementRequest ? procurementRequest._id : undefined,
      vendorId: vendor._id,
      projectId: new mongoose.Types.ObjectId(projectId),
      items: validatedItems,
      subtotal,
      tax,
      total,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      approvalStatus,
      status: "DRAFT",
      notes: data.notes?.trim() || "",
      termsAndConditions: data.termsAndConditions?.trim() || "",
      createdBy: new mongoose.Types.ObjectId(actorId),
    });

    await po.save();

    // Mark procurement request as converted to PO
    if (procurementRequest) {
      procurementRequest.status = "CONVERTED_TO_PO";
      await procurementRequest.save();
    }

    await logAuditAction({
      action: "PURCHASE_ORDER_CREATED",
      entityType: "PurchaseOrder",
      entityId: po._id.toString(),
      actorUserId: actorId,
      projectId,
      metadata: {
        poNumber: po.poNumber,
        vendorId: vendor._id.toString(),
        total: po.total,
        approvalStatus: po.approvalStatus,
      },
    });

    return po;
  }

  async approvePurchaseOrder(
    id: string,
    data: { decision: "APPROVE" | "REJECT"; notes?: string },
    actorId: string
  ): Promise<IPurchaseOrder> {
    const po = await this.getPurchaseOrderById(id);

    if (po.approvalStatus !== "PENDING_APPROVAL" && po.approvalStatus !== "DRAFT") {
      throw new BadRequestError(`Cannot review purchase order in status '${po.approvalStatus}'`);
    }

    if (data.decision === "APPROVE") {
      po.approvalStatus = "APPROVED";
      po.status = "ISSUED"; // Active issued PO ready for delivery
      po.approvedBy = new mongoose.Types.ObjectId(actorId);
      po.approvedAt = new Date();
    } else {
      po.approvalStatus = "REJECTED";
      po.status = "CANCELLED";
    }

    if (data.notes) {
      po.notes = po.notes ? `${po.notes} | Review note: ${data.notes}` : data.notes;
    }

    await po.save();

    await logAuditAction({
      action: data.decision === "APPROVE" ? "PURCHASE_ORDER_APPROVED" : "PURCHASE_ORDER_REJECTED",
      entityType: "PurchaseOrder",
      entityId: po._id.toString(),
      actorUserId: actorId,
      projectId: po.projectId.toString(),
      metadata: { poNumber: po.poNumber, decision: data.decision },
    });

    return po;
  }

  async cancelPurchaseOrder(id: string, actorId: string): Promise<IPurchaseOrder> {
    const po = await this.getPurchaseOrderById(id);

    const hasReceivedItems = po.items.some((i) => (i.receivedQuantity || 0) > 0);
    if (hasReceivedItems) {
      throw new BadRequestError("Cannot cancel a purchase order that has already received materials");
    }

    po.status = "CANCELLED";
    await po.save();

    await logAuditAction({
      action: "PURCHASE_ORDER_CANCELLED",
      entityType: "PurchaseOrder",
      entityId: po._id.toString(),
      actorUserId: actorId,
      projectId: po.projectId.toString(),
      metadata: { poNumber: po.poNumber },
    });

    return po;
  }

  // ==========================================
  // 3. Material Receipts & Inventory Integration
  // ==========================================

  async getMaterialReceipts(
    projectId: string,
    filter: GetMaterialReceiptsFilter = {}
  ): Promise<{
    receipts: IMaterialReceipt[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID");
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (filter.purchaseOrderId && mongoose.Types.ObjectId.isValid(filter.purchaseOrderId)) {
      query.purchaseOrderId = new mongoose.Types.ObjectId(filter.purchaseOrderId);
    }
    if (filter.vendorId && mongoose.Types.ObjectId.isValid(filter.vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(filter.vendorId);
    }
    if (filter.locationId && mongoose.Types.ObjectId.isValid(filter.locationId)) {
      query.locationId = new mongoose.Types.ObjectId(filter.locationId);
    }

    const [receipts, total] = await Promise.all([
      MaterialReceiptModel.find(query)
        .populate("vendorId", "code name")
        .populate("locationId", "name type")
        .populate("receivedBy", "firstName lastName email")
        .populate("items.materialId", "code name category unit")
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      MaterialReceiptModel.countDocuments(query),
    ]);

    return {
      receipts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getMaterialReceiptById(id: string): Promise<IMaterialReceipt> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid material receipt ID");
    }

    const receipt = await MaterialReceiptModel.findById(id)
      .populate("purchaseOrderId", "poNumber total status approvalStatus")
      .populate("vendorId", "code name contact address")
      .populate("locationId", "name type address")
      .populate("receivedBy", "firstName lastName email")
      .populate("items.materialId", "code name category unit")
      .exec();

    if (!receipt) {
      throw new NotFoundError("Material receipt not found");
    }

    return receipt;
  }

  /**
   * Records material receipt from a purchase order and automatically updates inventory balances and transaction ledger.
   */
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
    },
    actorId: string
  ): Promise<{ receipt: IMaterialReceipt; purchaseOrder: IPurchaseOrder }> {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID");
    }

    const po = await PurchaseOrderModel.findById(data.purchaseOrderId).exec();
    if (!po) {
      throw new NotFoundError("Purchase order not found");
    }

    if (po.projectId.toString() !== projectId) {
      throw new BadRequestError("Purchase order does not belong to this project");
    }

    if (po.approvalStatus !== "APPROVED") {
      throw new BadRequestError(`Cannot receive against PO that is not approved. Current status: ${po.approvalStatus}`);
    }

    if (po.status === "FULFILLED" || po.status === "CANCELLED") {
      throw new BadRequestError(`Cannot receive against purchase order in status '${po.status}'`);
    }

    const receiptNumber = await this.generateNumber("MR", MaterialReceiptModel);

    const receiptItems: Array<{
      materialId: mongoose.Types.ObjectId;
      receivedQuantity: number;
      acceptedQuantity: number;
      rejectedQuantity: number;
      unitPrice: number;
      totalCost: number;
      rejectionReason?: string;
    }> = [];

    // Process each line item
    for (const itemInput of data.items) {
      const poItem = po.items.find(
        (i) => i.materialId.toString() === itemInput.materialId
      );

      if (!poItem) {
        throw new BadRequestError(`Material ${itemInput.materialId} is not part of this purchase order`);
      }

      const receivedQty = Number(itemInput.receivedQuantity);
      const acceptedQty = Number(itemInput.acceptedQuantity);
      const rejectedQty = Number(itemInput.rejectedQuantity) || 0;

      if (acceptedQty + rejectedQty > receivedQty) {
        throw new BadRequestError("Sum of accepted and rejected quantities cannot exceed received quantity");
      }

      const remainingQtyOnPO = poItem.quantity - (poItem.receivedQuantity || 0);
      if (acceptedQty > remainingQtyOnPO) {
        throw new BadRequestError(
          `Accepted quantity (${acceptedQty}) exceeds remaining unfulfilled PO quantity (${remainingQtyOnPO})`
        );
      }

      const itemTotalCost = Number((acceptedQty * poItem.unitPrice).toFixed(2));

      receiptItems.push({
        materialId: poItem.materialId,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        unitPrice: poItem.unitPrice,
        totalCost: itemTotalCost,
        rejectionReason: itemInput.rejectionReason || "",
      });

      // Update inventory balance if acceptedQuantity > 0
      if (acceptedQty > 0) {
        await inventoryService.receiveMaterials(
          {
            locationId: data.locationId,
            materialId: poItem.materialId.toString(),
            quantity: acceptedQty,
            unitCost: poItem.unitPrice,
            referenceType: "PURCHASE_ORDER",
            referenceId: po._id.toString(),
            projectId,
            reason: `PO Receipt ${po.poNumber} (Receipt: ${receiptNumber})`,
          },
          actorId
        );

        // Increment received quantity on PO
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + acceptedQty;
      }
    }

    // Determine updated PO status
    const allItemsFulfilled = po.items.every(
      (i) => (i.receivedQuantity || 0) >= i.quantity
    );
    po.status = allItemsFulfilled ? "FULFILLED" : "PARTIALLY_RECEIVED";
    await po.save();

    const receipt = new MaterialReceiptModel({
      receiptNumber,
      purchaseOrderId: po._id,
      vendorId: po.vendorId,
      projectId: new mongoose.Types.ObjectId(projectId),
      locationId: new mongoose.Types.ObjectId(data.locationId),
      receivedBy: new mongoose.Types.ObjectId(actorId),
      receivedAt: new Date(),
      items: receiptItems,
      notes: data.notes?.trim() || "",
      invoiceNumber: data.invoiceNumber?.trim() || "",
      deliveryChallanNumber: data.deliveryChallanNumber?.trim() || "",
    });

    await receipt.save();

    // Update vendor order and delivery performance
    const isDeliveryOnTime = po.expectedDeliveryDate
      ? new Date() <= new Date(po.expectedDeliveryDate)
      : true;

    if (po.vendorId) {
      await VendorModel.findByIdAndUpdate(po.vendorId, {
        $inc: {
          "performanceSummary.totalOrders": 1,
        },
        $set: {
          "performanceSummary.notes": isDeliveryOnTime ? "On-time fulfillment" : "Delayed fulfillment",
        },
      }).exec();
    }

    await logAuditAction({
      action: "MATERIAL_RECEIPT_CREATED",
      entityType: "MaterialReceipt",
      entityId: receipt._id.toString(),
      actorUserId: actorId,
      projectId,
      metadata: {
        receiptNumber: receipt.receiptNumber,
        purchaseOrderId: po._id.toString(),
        poNumber: po.poNumber,
        poStatus: po.status,
      },
    });

    return { receipt, purchaseOrder: po };
  }
}

export const procurementService = new ProcurementService();
export default procurementService;
