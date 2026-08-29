import mongoose from "mongoose";
import BOMModel, { IBOM } from "./bom.model.js";
import BOMItemModel, { IBOMItem } from "./bomItem.model.js";
import MaterialModel from "../materials/material.model.js";
import { NotFoundError, BadRequestError } from "../../utils/AppError.js";
import { logAuditAction } from "../audit/auditLog.model.js";

export class BOMService {
  async getBOMsByProject(projectId: string): Promise<IBOM[]> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID format");
    }

    return BOMModel.find({ projectId })
      .sort({ version: -1, createdAt: -1 })
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .lean() as unknown as IBOM[];
  }

  async getBOMById(bomId: string): Promise<{ bom: IBOM; items: IBOMItem[] }> {
    if (!mongoose.Types.ObjectId.isValid(bomId)) {
      throw new BadRequestError("Invalid BOM ID format");
    }

    const bom = await BOMModel.findById(bomId)
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .exec();

    if (!bom) {
      throw new NotFoundError("BOM not found");
    }

    const items = await BOMItemModel.find({ bomId })
      .populate("materialId", "code name category unit unitPrice minimumStock reorderLevel")
      .lean();

    return {
      bom,
      items: items as unknown as IBOMItem[],
    };
  }

  async createBOM(
    projectId: string,
    data: {
      phaseId?: string;
      taskId?: string;
      notes?: string;
      items?: Array<{
        materialId: string;
        plannedQuantity: number;
        unit: string;
        unitCost?: number;
        notes?: string;
      }>;
    },
    actorId: string
  ): Promise<{ bom: IBOM; items: IBOMItem[] }> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError("Invalid project ID format");
    }

    // Get latest version
    const latestBOM = await BOMModel.findOne({ projectId }).sort({ version: -1 });
    const version = latestBOM ? latestBOM.version + 1 : 1;

    const bom = await BOMModel.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      phaseId: data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : null,
      taskId: data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null,
      version,
      status: "DRAFT",
      approvalStatus: "DRAFT",
      createdBy: new mongoose.Types.ObjectId(actorId),
      notes: data.notes || "",
    });

    const createdItems: IBOMItem[] = [];

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (!mongoose.Types.ObjectId.isValid(item.materialId)) {
          throw new BadRequestError(`Invalid material ID: ${item.materialId}`);
        }

        const materialExists = await MaterialModel.exists({ _id: item.materialId });
        if (!materialExists) {
          throw new NotFoundError(`Material not found: ${item.materialId}`);
        }

        const plannedQty = Number(item.plannedQuantity);
        const bomItem = await BOMItemModel.create({
          bomId: bom._id,
          materialId: new mongoose.Types.ObjectId(item.materialId),
          plannedQuantity: plannedQty,
          usedQuantity: 0,
          remainingQuantity: plannedQty,
          variance: -plannedQty,
          unit: item.unit,
          unitCost: item.unitCost || 0,
          notes: item.notes || "",
        });
        createdItems.push(bomItem);
      }
    }

    await logAuditAction({
      actorUserId: actorId,
      action: "BOM_CREATED",
      entityType: "BOM",
      entityId: bom._id.toString(),
      projectId,
      metadata: { version: bom.version, itemCount: createdItems.length },
    });

    return { bom, items: createdItems };
  }

  async addBOMItem(
    bomId: string,
    data: {
      materialId: string;
      plannedQuantity: number;
      unit: string;
      unitCost?: number;
      notes?: string;
    },
    actorId?: string
  ): Promise<IBOMItem> {
    if (!mongoose.Types.ObjectId.isValid(bomId)) {
      throw new BadRequestError("Invalid BOM ID format");
    }

    const bom = await BOMModel.findById(bomId).exec();
    if (!bom) {
      throw new NotFoundError("BOM not found");
    }

    if (bom.approvalStatus === "APPROVED") {
      throw new BadRequestError("Cannot modify an approved BOM. Create a new revision version.");
    }

    if (!mongoose.Types.ObjectId.isValid(data.materialId)) {
      throw new BadRequestError("Invalid material ID");
    }

    const material = await MaterialModel.findById(data.materialId).exec();
    if (!material) {
      throw new NotFoundError("Material not found");
    }

    const plannedQty = Number(data.plannedQuantity);
    const item = await BOMItemModel.create({
      bomId: bom._id,
      materialId: new mongoose.Types.ObjectId(data.materialId),
      plannedQuantity: plannedQty,
      usedQuantity: 0,
      remainingQuantity: plannedQty,
      variance: -plannedQty,
      unit: data.unit || material.unit,
      unitCost: data.unitCost || material.unitPrice || 0,
      notes: data.notes || "",
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "BOM_ITEM_ADDED",
      entityType: "BOMItem",
      entityId: item._id.toString(),
      projectId: bom.projectId.toString(),
      metadata: { bomId, materialId: data.materialId, plannedQuantity: plannedQty },
    });

    return item;
  }

  async updateBOMItem(
    bomId: string,
    itemId: string,
    data: Partial<{
      plannedQuantity: number;
      usedQuantity: number;
      unit: string;
      unitCost: number;
      notes: string;
    }>,
    actorId?: string
  ): Promise<IBOMItem> {
    if (!mongoose.Types.ObjectId.isValid(bomId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw new BadRequestError("Invalid BOM ID or item ID format");
    }

    const bom = await BOMModel.findById(bomId).exec();
    if (!bom) {
      throw new NotFoundError("BOM not found");
    }

    if (bom.approvalStatus === "APPROVED") {
      throw new BadRequestError("Cannot modify an approved BOM. Create a new revision version.");
    }

    const item = await BOMItemModel.findOne({ _id: itemId, bomId }).exec();
    if (!item) {
      throw new NotFoundError("BOM item not found");
    }

    if (data.plannedQuantity !== undefined) {
      item.plannedQuantity = Number(data.plannedQuantity);
    }
    if (data.usedQuantity !== undefined) {
      item.usedQuantity = Number(data.usedQuantity);
    }
    if (data.unit !== undefined) {
      item.unit = data.unit;
    }
    if (data.unitCost !== undefined) {
      item.unitCost = Number(data.unitCost);
    }
    if (data.notes !== undefined) {
      item.notes = data.notes;
    }

    item.remainingQuantity = Math.max(0, item.plannedQuantity - item.usedQuantity);
    item.variance = item.usedQuantity - item.plannedQuantity;

    await item.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "BOM_ITEM_UPDATED",
      entityType: "BOMItem",
      entityId: item._id.toString(),
      projectId: bom.projectId.toString(),
      metadata: { bomId, itemId, updates: data },
    });

    return item;
  }

  async deleteBOMItem(bomId: string, itemId: string, actorId?: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(bomId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw new BadRequestError("Invalid BOM ID or item ID format");
    }

    const bom = await BOMModel.findById(bomId).exec();
    if (!bom) {
      throw new NotFoundError("BOM not found");
    }

    if (bom.approvalStatus === "APPROVED") {
      throw new BadRequestError("Cannot modify an approved BOM. Create a new revision version.");
    }

    const item = await BOMItemModel.findOneAndDelete({ _id: itemId, bomId }).exec();
    if (!item) {
      throw new NotFoundError("BOM item not found");
    }

    await logAuditAction({
      actorUserId: actorId,
      action: "BOM_ITEM_DELETED",
      entityType: "BOMItem",
      entityId: itemId,
      projectId: bom.projectId.toString(),
      metadata: { bomId, itemId },
    });
  }

  async approveBOM(bomId: string, actorId: string, notes?: string): Promise<IBOM> {
    if (!mongoose.Types.ObjectId.isValid(bomId)) {
      throw new BadRequestError("Invalid BOM ID format");
    }

    const bom = await BOMModel.findById(bomId).exec();
    if (!bom) {
      throw new NotFoundError("BOM not found");
    }

    // Supersede previously active BOMs for this project
    await BOMModel.updateMany(
      { projectId: bom.projectId, _id: { $ne: bom._id }, status: "ACTIVE" },
      { status: "SUPERSEDED" }
    );

    bom.approvalStatus = "APPROVED";
    bom.status = "ACTIVE";
    bom.approvedBy = new mongoose.Types.ObjectId(actorId);
    bom.approvedAt = new Date();
    if (notes) {
      bom.notes = (bom.notes ? bom.notes + "\n" : "") + `Approval note: ${notes}`;
    }

    await bom.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "BOM_APPROVED",
      entityType: "BOM",
      entityId: bom._id.toString(),
      projectId: bom.projectId.toString(),
      metadata: { version: bom.version },
    });

    return bom;
  }
}

export const bomService = new BOMService();
export default bomService;
