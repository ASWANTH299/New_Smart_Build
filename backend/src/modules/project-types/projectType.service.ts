import { ProjectTypeModel, IProjectType } from "./projectType.model.js";
import { ConflictError } from "../../utils/AppError.js";

const DEFAULT_TYPES = [
  { name: "Residential Building", code: "RESIDENTIAL", description: "Apartments, individual houses, and residential complexes" },
  { name: "Commercial Complex", code: "COMMERCIAL", description: "Office spaces, shopping centers, and commercial hubs" },
  { name: "Infrastructure & Roads", code: "INFRASTRUCTURE", description: "Highways, bridges, and public utilities" },
  { name: "Industrial Plant", code: "INDUSTRIAL", description: "Warehouses, factories, and industrial facilities" },
  { name: "Renovation & Fit-out", code: "RENOVATION", description: "Interior refurbishment and structural remodeling" },
  { name: "Luxury Villa", code: "VILLA", description: "Custom residential villas and private estates" },
];

export class ProjectTypeService {
  async getProjectTypes(): Promise<IProjectType[]> {
    let types = await ProjectTypeModel.find({ status: "ACTIVE" }).sort({ name: 1 }).exec();
    if (types.length === 0) {
      await ProjectTypeModel.insertMany(DEFAULT_TYPES);
      types = await ProjectTypeModel.find({ status: "ACTIVE" }).sort({ name: 1 }).exec();
    }
    return types;
  }

  async createProjectType(input: { name: string; code: string; description?: string }): Promise<IProjectType> {
    const existing = await ProjectTypeModel.findOne({ code: input.code.toUpperCase().trim() }).exec();
    if (existing) {
      throw new ConflictError("Project type with this code already exists.");
    }

    return await ProjectTypeModel.create({
      name: input.name.trim(),
      code: input.code.toUpperCase().trim(),
      description: input.description || "",
      status: "ACTIVE",
    });
  }
}

export const projectTypeService = new ProjectTypeService();
export default projectTypeService;
