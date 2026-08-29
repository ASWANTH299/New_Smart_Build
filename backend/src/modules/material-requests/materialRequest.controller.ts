import { Request, Response, NextFunction } from "express";
import materialRequestService from "./materialRequest.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { MaterialRequestStatus } from "./materialRequest.model.js";

export class MaterialRequestController {
  async getMaterialRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { status, requestedBy, page, limit } = req.query;
      const result = await materialRequestService.getMaterialRequests(projectId, {
        status: status as MaterialRequestStatus,
        requestedBy: requestedBy as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.requests, result.pagination, 200, "Material requests retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMaterialRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const request = await materialRequestService.getMaterialRequestById(id);
      sendSuccess(res, request, undefined, 200, "Material request details retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createMaterialRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const actorId = req.user?._id?.toString() || "";
      const request = await materialRequestService.createMaterialRequest(projectId, req.body, actorId);
      sendSuccess(res, request, undefined, 201, "Material request created successfully");
    } catch (error) {
      next(error);
    }
  }

  async submitMaterialRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await materialRequestService.submitMaterialRequest(id, actorId);
      sendSuccess(res, request, undefined, 200, "Material request submitted for approval");
    } catch (error) {
      next(error);
    }
  }

  async reviewMaterialRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await materialRequestService.reviewMaterialRequest(id, req.body, actorId);
      sendSuccess(res, request, undefined, 200, `Material request ${req.body.decision.toLowerCase()}d successfully`);
    } catch (error) {
      next(error);
    }
  }

  async issueMaterialRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await materialRequestService.issueMaterialRequest(id, req.body, actorId);
      sendSuccess(res, request, undefined, 200, "Materials issued successfully against request");
    } catch (error) {
      next(error);
    }
  }

  async cancelMaterialRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString() || "";
      const request = await materialRequestService.cancelMaterialRequest(id, actorId);
      sendSuccess(res, request, undefined, 200, "Material request cancelled successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const materialRequestController = new MaterialRequestController();
export default materialRequestController;
