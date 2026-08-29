import { Request, Response, NextFunction } from "express";
import { accessRequestService } from "./accessRequest.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class AccessRequestController {
  async createAccessRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await accessRequestService.createAccessRequest(req.body);
      sendSuccess(
        res,
        request,
        undefined,
        201,
        "Access request submitted successfully. An administrator will review your request."
      );
    } catch (error) {
      next(error);
    }
  }

  async getAccessRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const result = await accessRequestService.getAccessRequests({
        status,
        page,
        limit,
      });

      sendSuccess(res, result.requests, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveAccessRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = String(req.params.id);
      const adminUserId = req.user!._id.toString();
      const result = await accessRequestService.approveAccessRequest(
        requestId,
        req.body,
        adminUserId
      );

      sendSuccess(res, result, undefined, 200, "Access request approved successfully.");
    } catch (error) {
      next(error);
    }
  }

  async rejectAccessRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = String(req.params.id);
      const adminUserId = req.user!._id.toString();
      const result = await accessRequestService.rejectAccessRequest(
        requestId,
        req.body.reason,
        adminUserId
      );

      sendSuccess(res, result, undefined, 200, "Access request rejected.");
    } catch (error) {
      next(error);
    }
  }
}

export const accessRequestController = new AccessRequestController();
export default accessRequestController;
