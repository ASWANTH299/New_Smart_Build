import mongoose from "mongoose";
import MaterialModel, { IMaterial, MaterialStatus } from "./material.model.js";
import { NotFoundError, BadRequestError, ConflictError } from "../../utils/AppError.js";
import { logAuditAction } from "../audit/auditLog.model.js";

export interface GetMaterialsFilter {
  search?: string;
  category?: string;
  status?: MaterialStatus;
  page?: number;
  limit?: number;
}

export class MaterialService {
  async getMaterials(filter: GetMaterialsFilter = {}): Promise<{
    materials: IMaterial[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search.trim(), "i");
      query.$or = [
        { code: searchRegex },
        { name: searchRegex },
        { category: searchRegex },
        { specifications: searchRegex },
      ];
    }

    const [materials, total] = await Promise.all([
      MaterialModel.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      MaterialModel.countDocuments(query),
    ]);

    return {
      materials: materials as unknown as IMaterial[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getMaterialById(id: string): Promise<IMaterial> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid material ID format");
    }

    const material = await MaterialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundError("Material not found in catalog");
    }
    return material;
  }

  async createMaterial(
    data: {
      code: string;
      name: string;
      category: string;
      unit: string;
      specifications?: string;
      minimumStock?: number;
      reorderLevel?: number;
      unitPrice?: number;
      status?: MaterialStatus;
      notes?: string;
    },
    actorId?: string
  ): Promise<IMaterial> {
    const normalizedCode = data.code.trim().toUpperCase();
    const existing = await MaterialModel.findOne({ code: normalizedCode }).exec();
    if (existing) {
      throw new ConflictError(`Material with code '${normalizedCode}' already exists`);
    }

    const material = await MaterialModel.create({
      ...data,
      code: normalizedCode,
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_CREATED",
      entityType: "Material",
      entityId: material._id.toString(),
      metadata: { code: material.code, name: material.name },
    });

    return material;
  }

  async updateMaterial(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      unit: string;
      specifications: string;
      minimumStock: number;
      reorderLevel: number;
      unitPrice: number;
      status: MaterialStatus;
      notes: string;
    }>,
    actorId?: string
  ): Promise<IMaterial> {
    const material = await this.getMaterialById(id);

    Object.assign(material, data);
    await material.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "MATERIAL_UPDATED",
      entityType: "Material",
      entityId: material._id.toString(),
      metadata: { code: material.code, updates: data },
    });

    return material;
  }

  async getCategories(): Promise<string[]> {
    return MaterialModel.distinct("category");
  }
}

export const materialService = new MaterialService();
export default materialService;
