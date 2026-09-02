import { Request, Response, NextFunction } from "express";
import { equipmentService } from "./equipment.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export class EquipmentController {
  async createEquipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const equipment = await equipmentService.createEquipment(req.body);
      res.status(201).json({
        success: true,
        message: "Equipment master record created successfully",
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEquipmentList(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, ownershipType, status, page, limit } = req.query;
      const result = await equipmentService.getEquipmentList({
        search: search as string,
        category: category as any,
        ownershipType: ownershipType as any,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.equipment,
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

  async getEquipmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      const result = await equipmentService.getEquipmentById(equipmentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEquipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      const equipment = await equipmentService.updateEquipment(equipmentId, req.body);
      res.status(200).json({
        success: true,
        message: "Equipment details updated successfully",
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEquipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      await equipmentService.deleteEquipment(equipmentId);
      res.status(200).json({
        success: true,
        message: "Equipment record deleted or retired successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async assignEquipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const assignment = await equipmentService.assignEquipment(
        projectId,
        req.body,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: "Equipment assigned to project successfully",
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { status, category } = req.query;
      const assignments = await equipmentService.getProjectEquipment(projectId, {
        status: status as any,
        category: category as any,
      });

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, assignmentId } = req.params;
      const assignment = await equipmentService.updateAssignment(
        projectId,
        assignmentId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Equipment assignment updated successfully",
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  async reportBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      const result = await equipmentService.reportBreakdown(
        equipmentId,
        req.body,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: "Equipment breakdown logged and emergency repair ticket created",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async scheduleMaintenance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      const maintenance = await equipmentService.scheduleMaintenance(
        equipmentId,
        req.body,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: "Maintenance scheduled successfully",
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  async completeMaintenance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { equipmentId, maintenanceId } = req.params;
      const maintenance = await equipmentService.completeMaintenance(
        equipmentId,
        maintenanceId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Maintenance service completed and equipment status refreshed",
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordInspection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      const inspection = await equipmentService.recordInspection(
        equipmentId,
        req.body,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: "Equipment safety inspection recorded successfully",
        data: inspection,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const equipmentController = new EquipmentController();
export default equipmentController;
