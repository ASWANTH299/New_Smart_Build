import { Request, Response, NextFunction } from "express";
import procurementService from "./procurement.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ProcurementRequestStatus } from "./procurementRequest.model.js";
import { POApprovalStatus, POStatus } from "./purchaseOrder.model.js";

export class ProcurementController {
  // ==========================================
  // Procurement Requests
  // ==========================================

  async getProcurementRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { status, requestedBy, page, limit } = req.query;
      const result = await procurementService.getProcurementRequests(projectId, {
        status: status as ProcurementRequestStatus,
        requestedBy: requestedBy as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.requests, result.pagination, 200, "Procurement requests retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getProcurementRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const request = await procurementService.getProcurementRequestById(id);
      sendSuccess(res, request, undefined, 200, "Procurement request retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createProcurementRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const actorId = req.user?._id?.toString() || "";
      const request = await procurementService.createProcurementRequest(projectId, req.body, actorId);
      sendSuccess(res, request, undefined, 201, "Procurement request created successfully");
    } catch (error) {
      next(error);
    }
  }

  async submitProcurementRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await procurementService.submitProcurementRequest(id, actorId);
      sendSuccess(res, request, undefined, 200, "Procurement request submitted for review");
    } catch (error) {
      next(error);
    }
  }

  async reviewProcurementRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await procurementService.reviewProcurementRequest(id, req.body, actorId);
      sendSuccess(res, request, undefined, 200, `Procurement request ${req.body.decision.toLowerCase()}d successfully`);
    } catch (error) {
      next(error);
    }
  }

  async cancelProcurementRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await procurementService.cancelProcurementRequest(id, actorId);
      sendSuccess(res, request, undefined, 200, "Procurement request cancelled successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Purchase Orders
  // ==========================================

  async getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { vendorId, approvalStatus, status, page, limit } = req.query;
      const result = await procurementService.getPurchaseOrders(projectId, {
        vendorId: vendorId as string,
        approvalStatus: approvalStatus as POApprovalStatus,
        status: status as POStatus,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.purchaseOrders, result.pagination, 200, "Purchase orders retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const po = await procurementService.getPurchaseOrderById(id);
      sendSuccess(res, po, undefined, 200, "Purchase order retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const actorId = req.user?._id?.toString() || "";
      const po = await procurementService.createPurchaseOrder(projectId, req.body, actorId);
      sendSuccess(res, po, undefined, 201, "Purchase order created successfully");
    } catch (error) {
      next(error);
    }
  }

  async approvePurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const po = await procurementService.approvePurchaseOrder(id, req.body, actorId);
      sendSuccess(res, po, undefined, 200, `Purchase order ${req.body.decision.toLowerCase()}d successfully`);
    } catch (error) {
      next(error);
    }
  }

  async cancelPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const po = await procurementService.cancelPurchaseOrder(id, actorId);
      sendSuccess(res, po, undefined, 200, "Purchase order cancelled successfully");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Material Receipts & Receiving
  // ==========================================

  async getMaterialReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { purchaseOrderId, vendorId, locationId, page, limit } = req.query;
      const result = await procurementService.getMaterialReceipts(projectId, {
        purchaseOrderId: purchaseOrderId as string,
        vendorId: vendorId as string,
        locationId: locationId as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.receipts, result.pagination, 200, "Material receipts retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMaterialReceiptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const receipt = await procurementService.getMaterialReceiptById(id);
      sendSuccess(res, receipt, undefined, 200, "Material receipt retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async recordMaterialReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const actorId = req.user?._id?.toString() || "";
      const result = await procurementService.recordMaterialReceipt(projectId, req.body, actorId);
      sendSuccess(res, result, undefined, 201, "Material receipt recorded and inventory updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const procurementController = new ProcurementController();
export default procurementController;
