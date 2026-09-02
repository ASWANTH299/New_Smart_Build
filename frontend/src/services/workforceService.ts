import api from "./api.js";
import {
  Worker,
  WorkforceAssignment,
  Attendance,
  AttendanceSummary,
  WorkerTrade,
  WorkerType,
  WorkerStatus,
  AttendanceStatus,
} from "../types/workforce.js";

export interface CreateWorkerPayload {
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

export interface AssignWorkerPayload {
  workerId: string;
  phaseId?: string | null;
  taskId?: string | null;
  startDate?: string;
  endDate?: string | null;
  notes?: string;
}

export interface RecordAttendancePayload {
  workerId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  workingHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface BulkAttendancePayload {
  date: string;
  records: Array<{
    workerId: string;
    status: AttendanceStatus;
    checkIn?: string | null;
    checkOut?: string | null;
    workingHours?: number;
    overtimeHours?: number;
    notes?: string;
  }>;
}

export const workforceService = {
  // Global Workers Catalog
  async getWorkers(params?: {
    search?: string;
    trade?: string;
    workerType?: string;
    contractorId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Worker[]; meta?: { total: number; page: number; totalPages: number } }> {
    const res = await api.get("/workforce", { params });
    return res.data;
  },

  async getWorkerById(workerId: string): Promise<{
    success: boolean;
    data: {
      worker: Worker;
      activeAssignments: WorkforceAssignment[];
      assignmentHistory: WorkforceAssignment[];
    };
  }> {
    const res = await api.get(`/workforce/${workerId}`);
    return res.data;
  },

  async createWorker(payload: CreateWorkerPayload): Promise<{ success: boolean; data: Worker; message?: string }> {
    const res = await api.post("/workforce", payload);
    return res.data;
  },

  async updateWorker(
    workerId: string,
    payload: Partial<CreateWorkerPayload>
  ): Promise<{ success: boolean; data: Worker; message?: string }> {
    const res = await api.put(`/workforce/${workerId}`, payload);
    return res.data;
  },

  async deleteWorker(workerId: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/workforce/${workerId}`);
    return res.data;
  },

  // Project-Scoped Workforce Assignments
  async getProjectWorkforce(
    projectId: string,
    params?: { status?: string; trade?: string; phaseId?: string; taskId?: string }
  ): Promise<{ success: boolean; data: WorkforceAssignment[] }> {
    const res = await api.get(`/projects/${projectId}/workforce`, { params });
    return res.data;
  },

  async assignWorker(
    projectId: string,
    payload: AssignWorkerPayload
  ): Promise<{ success: boolean; data: WorkforceAssignment; message?: string }> {
    const res = await api.post(`/projects/${projectId}/workforce`, payload);
    return res.data;
  },

  async updateAssignment(
    projectId: string,
    assignmentId: string,
    payload: { phaseId?: string | null; taskId?: string | null; endDate?: string | null; status?: string; notes?: string }
  ): Promise<{ success: boolean; data: WorkforceAssignment; message?: string }> {
    const res = await api.put(`/projects/${projectId}/workforce/${assignmentId}`, payload);
    return res.data;
  },

  async deleteAssignment(projectId: string, assignmentId: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/projects/${projectId}/workforce/${assignmentId}`);
    return res.data;
  },

  // Project-Scoped Daily Attendance
  async getProjectAttendance(
    projectId: string,
    params?: { date?: string; startDate?: string; endDate?: string; workerId?: string; status?: string }
  ): Promise<{ success: boolean; data: Attendance[] }> {
    const res = await api.get(`/projects/${projectId}/attendance`, { params });
    return res.data;
  },

  async getProjectAttendanceSummary(
    projectId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<{ success: boolean; data: AttendanceSummary }> {
    const res = await api.get(`/projects/${projectId}/attendance/summary`, { params });
    return res.data;
  },

  async recordAttendance(
    projectId: string,
    payload: RecordAttendancePayload
  ): Promise<{ success: boolean; data: Attendance; message?: string }> {
    const res = await api.post(`/projects/${projectId}/attendance`, payload);
    return res.data;
  },

  async bulkRecordAttendance(
    projectId: string,
    payload: BulkAttendancePayload
  ): Promise<{ success: boolean; data: { inserted: number; updated: number; records: Attendance[] }; message?: string }> {
    const res = await api.post(`/projects/${projectId}/attendance/bulk`, payload);
    return res.data;
  },

  async updateAttendance(
    projectId: string,
    attendanceId: string,
    payload: Partial<RecordAttendancePayload>
  ): Promise<{ success: boolean; data: Attendance; message?: string }> {
    const res = await api.put(`/projects/${projectId}/attendance/${attendanceId}`, payload);
    return res.data;
  },
};

export default workforceService;
