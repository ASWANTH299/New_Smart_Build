import { ProjectTemplateModel, IProjectTemplate } from "./projectTemplate.model.js";
import { NotFoundError } from "../../utils/AppError.js";

const DEFAULT_TEMPLATES = [
  {
    name: "Standard Residential Construction",
    description: "Standard 5-phase residential building roadmap from excavation to finishing.",
    defaultPhases: [
      { name: "Site Preparation & Excavation", sequence: 1, description: "Clearing site and digging foundation" },
      { name: "Substructure & Foundation", sequence: 2, description: "Piling, footing, and plinth beam concreting" },
      { name: "Superstructure (RCC Frame)", sequence: 3, description: "Columns, beams, and slab castings" },
      { name: "Masonry & Plastering", sequence: 4, description: "Brickwork, internal and external plastering" },
      { name: "Finishing & Handover", sequence: 5, description: "Flooring, painting, electrical, plumbing, and final QA" },
    ],
    defaultBudgetCategories: ["Civil & Structure", "Materials", "Labor", "Equipment", "Finishing", "Contingency"],
    status: "ACTIVE" as const,
  },
  {
    name: "Commercial Shell & Core",
    description: "Multi-tenant commercial building roadmap.",
    defaultPhases: [
      { name: "Excavation & Shoring", sequence: 1, description: "Deep excavation with safety shoring" },
      { name: "Basement & Podium", sequence: 2, description: "Basement parking and podium concrete structure" },
      { name: "Tower RCC & Facade", sequence: 3, description: "Tower structure and glass facade envelope" },
      { name: "MEP Services Infrastructure", sequence: 4, description: "HVAC, fire suppression, elevators, and transformers" },
      { name: "Testing & Commissioning", sequence: 5, description: "Statutory approvals, life safety testing, and handover" },
    ],
    defaultBudgetCategories: ["Structure", "MEP", "Facade", "Equipment", "Statutory Fees", "Contingency"],
    status: "ACTIVE" as const,
  },
];

export class ProjectTemplateService {
  async getTemplates(): Promise<IProjectTemplate[]> {
    let templates = await ProjectTemplateModel.find({ status: "ACTIVE" }).sort({ name: 1 }).exec();
    if (templates.length === 0) {
      await ProjectTemplateModel.insertMany(DEFAULT_TEMPLATES);
      templates = await ProjectTemplateModel.find({ status: "ACTIVE" }).sort({ name: 1 }).exec();
    }
    return templates;
  }

  async getTemplateById(templateId: string): Promise<IProjectTemplate> {
    const template = await ProjectTemplateModel.findById(templateId).exec();
    if (!template) {
      throw new NotFoundError("Project template not found.");
    }
    return template;
  }

  async createTemplate(input: {
    name: string;
    description?: string;
    defaultPhases: Array<{ name: string; sequence: number; description?: string }>;
    defaultBudgetCategories?: string[];
  }): Promise<IProjectTemplate> {
    return await ProjectTemplateModel.create({
      name: input.name.trim(),
      description: input.description || "",
      defaultPhases: input.defaultPhases,
      defaultBudgetCategories: input.defaultBudgetCategories || [],
      status: "ACTIVE",
    });
  }
}

export const projectTemplateService = new ProjectTemplateService();
export default projectTemplateService;
