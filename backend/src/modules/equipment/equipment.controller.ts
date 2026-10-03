import { Request, Response, NextFunction } from "express";
import { equipmentService } from "./equipment.service.js";
export class EquipmentController {
  async createEquipment(req: Request, res: Response, next: NextFunction) {
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
      const equipmentId = String(req.params.equipmentId);
      const result = await equipmentService.getEquipmentById(equipmentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentId = String(req.params.equipmentId);
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

  async deleteEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentId = String(req.params.equipmentId);
      await equipmentService.deleteEquipment(equipmentId);
      res.status(200).json({
        success: true,
        message: "Equipment record deleted or retired successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async assignEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const assignment = await equipmentService.assignEquipment(
        projectId,
        req.body,
        (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || ""
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
      const projectId = String(req.params.projectId);
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

  async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const assignmentId = String(req.params.assignmentId);
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

  async reportBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentId = String(req.params.equipmentId);
      const result = await equipmentService.reportBreakdown(
        equipmentId,
        req.body,
        (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || ""
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

  async scheduleMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentId = String(req.params.equipmentId);
      const maintenance = await equipmentService.scheduleMaintenance(
        equipmentId,
        req.body,
        (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || ""
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

  async completeMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentId = String(req.params.equipmentId);
      const maintenanceId = String(req.params.maintenanceId);
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

  async recordInspection(req: Request, res: Response, next: NextFunction) {
    try {
      const equipmentId = String(req.params.equipmentId);
      const inspection = await equipmentService.recordInspection(
        equipmentId,
        req.body,
        (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || ""
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
