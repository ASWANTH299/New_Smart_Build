import { Request, Response, NextFunction } from "express";
import { issueService } from "./issue.service.js";

export class IssueController {
  async createIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = (req.user?._id || req.user?.id)?.toString() || "";
      const issue = await issueService.createIssue(
        projectId,
        req.body,
        userId
      );
      res.status(201).json({
        success: true,
        message: "Issue reported successfully",
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  async getIssuesByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { status, priority, category, assignedTo, search, page, limit } = req.query;

      const result = await issueService.getIssuesByProject(projectId, {
        status: status as any,
        priority: priority as any,
        category: category as any,
        assignedTo: assignedTo as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.issues,
        meta: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getIssueById(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, issueId } = req.params;
      const issue = await issueService.getIssueById(projectId, issueId);
      res.status(200).json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, issueId } = req.params;
      const userId = (req.user?._id || req.user?.id)?.toString() || "";
      const issue = await issueService.updateIssue(
        projectId,
        issueId,
        req.body,
        userId
      );
      res.status(200).json({
        success: true,
        message: "Issue updated successfully",
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, issueId } = req.params;
      const { resolutionNotes } = req.body;
      const userId = (req.user?._id || req.user?.id)?.toString() || "";
      const issue = await issueService.resolveIssue(
        projectId,
        issueId,
        resolutionNotes,
        userId
      );
      res.status(200).json({
        success: true,
        message: "Issue resolved successfully",
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  async closeIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, issueId } = req.params;
      const userId = (req.user?._id || req.user?.id)?.toString() || "";
      const issue = await issueService.closeIssue(
        projectId,
        issueId,
        userId
      );
      res.status(200).json({
        success: true,
        message: "Issue closed successfully",
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const issueController = new IssueController();
