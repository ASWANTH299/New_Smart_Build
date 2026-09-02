import mongoose from "mongoose";
import { Worker, IWorker, WorkerTrade, WorkerType, WorkerStatus } from "./worker.model.js";
import { WorkforceAssignment, IWorkforceAssignment, AssignmentStatus } from "./workforceAssignment.model.js";
import { AppError } from "../../utils/AppError.js";

export interface CreateWorkerInput {
  name: string;
  workerType?: WorkerType;
  trade: WorkerTrade;
  contractorId?: string | null;
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
  };
  status?: WorkerStatus;
  notes?: string;
}

export interface UpdateWorkerInput {
  name?: string;
  workerType?: WorkerType;
  trade?: WorkerTrade;
  contractorId?: string | null;
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
  };
  status?: WorkerStatus;
  notes?: string;
}

export interface AssignWorkerInput {
  workerId: string;
  phaseId?: string | null;
  taskId?: string | null;
  startDate?: string | Date;
  endDate?: string | Date | null;
  notes?: string;
}

export interface UpdateAssignmentInput {
  phaseId?: string | null;
  taskId?: string | null;
  endDate?: string | Date | null;
  status?: AssignmentStatus;
  notes?: string;
}

export class WorkforceService {
  /**
   * Create a new worker master record
   */
  async createWorker(data: CreateWorkerInput): Promise<IWorker> {
    const worker = new Worker({
      name: data.name.trim(),
      workerType: data.workerType || "DIRECT",
      trade: data.trade,
      contractorId: data.contractorId ? new mongoose.Types.ObjectId(data.contractorId) : null,
      contact: data.contact,
      status: data.status || "ACTIVE",
      notes: data.notes,
    });

    return await worker.save();
  }

  /**
   * List all workers with pagination and filters
   */
  async getWorkers(filters: {
    search?: string;
    trade?: WorkerTrade;
    workerType?: WorkerType;
    contractorId?: string;
    status?: WorkerStatus;
    page?: number;
    limit?: number;
  }): Promise<{ workers: IWorker[]; total: number; page: number; totalPages: number }> {
    const query: mongoose.FilterQuery<IWorker> = {};

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { "contact.phone": { $regex: filters.search, $options: "i" } },
        { "contact.email": { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.trade) {
      query.trade = filters.trade;
    }

    if (filters.workerType) {
      query.workerType = filters.workerType;
    }

    if (filters.contractorId) {
      query.contractorId = new mongoose.Types.ObjectId(filters.contractorId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [workers, total] = await Promise.all([
      Worker.find(query)
        .populate("contractorId", "name code contact")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Worker.countDocuments(query),
    ]);

    return {
      workers,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single worker details with active assignments and stats
   */
  async getWorkerById(workerId: string): Promise<{
    worker: IWorker;
    activeAssignments: IWorkforceAssignment[];
    assignmentHistory: IWorkforceAssignment[];
  }> {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      throw new AppError("Invalid worker ID", 400);
    }

    const worker = await Worker.findById(workerId).populate("contractorId", "name code contact");
    if (!worker) {
      throw new AppError("Worker not found", 404);
    }

    const assignments = await WorkforceAssignment.find({ workerId })
      .populate("projectId", "name code status")
      .populate("phaseId", "name sequence")
      .populate("taskId", "title code status")
      .populate("assignedBy", "firstName lastName email")
      .sort({ startDate: -1 });

    const activeAssignments = assignments.filter((a) => a.status === "ACTIVE");
    const assignmentHistory = assignments.filter((a) => a.status !== "ACTIVE");

    return {
      worker,
      activeAssignments,
      assignmentHistory,
    };
  }

  /**
   * Update worker details
   */
  async updateWorker(workerId: string, data: UpdateWorkerInput): Promise<IWorker> {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      throw new AppError("Invalid worker ID", 400);
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new AppError("Worker not found", 404);
    }

    if (data.name !== undefined) worker.name = data.name.trim();
    if (data.workerType !== undefined) worker.workerType = data.workerType;
    if (data.trade !== undefined) worker.trade = data.trade;
    if (data.contractorId !== undefined) {
      worker.contractorId = data.contractorId ? new mongoose.Types.ObjectId(data.contractorId) : undefined;
    }
    if (data.contact !== undefined) worker.contact = data.contact;
    if (data.status !== undefined) worker.status = data.status;
    if (data.notes !== undefined) worker.notes = data.notes;

    return await worker.save();
  }

  /**
   * Delete or deactivate worker
   */
  async deleteWorker(workerId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      throw new AppError("Invalid worker ID", 400);
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new AppError("Worker not found", 404);
    }

    // Check if worker has active assignments
    const activeCount = await WorkforceAssignment.countDocuments({
      workerId,
      status: "ACTIVE",
    });

    if (activeCount > 0) {
      // Soft-delete / deactivate
      worker.status = "INACTIVE";
      await worker.save();
    } else {
      await Worker.findByIdAndDelete(workerId);
    }
  }

  /**
   * Assign a worker to a project, phase, and/or task
   */
  async assignWorker(
    projectId: string,
    data: AssignWorkerInput,
    assignedBy: string
  ): Promise<IWorkforceAssignment> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(data.workerId)) {
      throw new AppError("Invalid worker ID", 400);
    }

    const worker = await Worker.findById(data.workerId);
    if (!worker) {
      throw new AppError("Worker not found", 404);
    }

    // Check if already actively assigned to this project and task
    const existingActive = await WorkforceAssignment.findOne({
      projectId,
      workerId: data.workerId,
      taskId: data.taskId || null,
      status: "ACTIVE",
    });

    if (existingActive) {
      throw new AppError("Worker is already actively assigned to this project and task", 409);
    }

    const assignment = new WorkforceAssignment({
      projectId: new mongoose.Types.ObjectId(projectId),
      workerId: new mongoose.Types.ObjectId(data.workerId),
      phaseId: data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : null,
      taskId: data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null,
      assignedBy: new mongoose.Types.ObjectId(assignedBy),
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: "ACTIVE",
      notes: data.notes,
    });

    await assignment.save();

    return await assignment.populate([
      { path: "workerId", select: "name trade workerType status contact" },
      { path: "phaseId", select: "name sequence" },
      { path: "taskId", select: "title code status" },
      { path: "assignedBy", select: "firstName lastName email" },
    ]);
  }

  /**
   * Get all workforce assignments for a project
   */
  async getProjectWorkforce(
    projectId: string,
    filters?: {
      status?: AssignmentStatus;
      trade?: WorkerTrade;
      phaseId?: string;
      taskId?: string;
    }
  ): Promise<IWorkforceAssignment[]> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const query: mongoose.FilterQuery<IWorkforceAssignment> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.phaseId) {
      query.phaseId = new mongoose.Types.ObjectId(filters.phaseId);
    }
    if (filters?.taskId) {
      query.taskId = new mongoose.Types.ObjectId(filters.taskId);
    }

    const assignments = await WorkforceAssignment.find(query)
      .populate("workerId", "name trade workerType status contact contractorId")
      .populate("phaseId", "name sequence")
      .populate("taskId", "title code status plannedQuantity completedQuantity")
      .populate("assignedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (filters?.trade) {
      return assignments.filter((a) => (a.workerId as unknown as IWorker)?.trade === filters.trade);
    }

    return assignments;
  }

  /**
   * Update an assignment
   */
  async updateAssignment(
    projectId: string,
    assignmentId: string,
    data: UpdateAssignmentInput
  ): Promise<IWorkforceAssignment> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new AppError("Invalid assignment ID", 400);
    }

    const assignment = await WorkforceAssignment.findOne({
      _id: assignmentId,
      projectId,
    });

    if (!assignment) {
      throw new AppError("Workforce assignment not found for this project", 404);
    }

    if (data.phaseId !== undefined) {
      assignment.phaseId = data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : undefined;
    }
    if (data.taskId !== undefined) {
      assignment.taskId = data.taskId ? new mongoose.Types.ObjectId(data.taskId) : undefined;
    }
    if (data.endDate !== undefined) {
      assignment.endDate = data.endDate ? new Date(data.endDate) : undefined;
    }
    if (data.status !== undefined) {
      assignment.status = data.status;
    }
    if (data.notes !== undefined) {
      assignment.notes = data.notes;
    }

    await assignment.save();

    return await assignment.populate([
      { path: "workerId", select: "name trade workerType status contact" },
      { path: "phaseId", select: "name sequence" },
      { path: "taskId", select: "title code status" },
    ]);
  }

  /**
   * Remove / Cancel an assignment
   */
  async deleteAssignment(projectId: string, assignmentId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new AppError("Invalid assignment ID", 400);
    }

    const assignment = await WorkforceAssignment.findOne({
      _id: assignmentId,
      projectId,
    });

    if (!assignment) {
      throw new AppError("Workforce assignment not found for this project", 404);
    }

    assignment.status = "CANCELLED";
    assignment.endDate = new Date();
    await assignment.save();
  }
}

export const workforceService = new WorkforceService();
export default workforceService;
