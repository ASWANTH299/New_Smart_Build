export type WorkerTrade =
  | "MASON"
  | "CARPENTER"
  | "ELECTRICIAN"
  | "PLUMBER"
  | "PAINTER"
  | "STEEL_FIXER"
  | "WELDER"
  | "HEAVY_OPERATOR"
  | "GENERAL_LABOR"
  | "SURVEYOR"
  | "FOREMAN"
  | "OTHER";

export type WorkerType = "DIRECT" | "CONTRACTOR" | "SUBCONTRACTOR" | "TEMPORARY";

export type WorkerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

export type AssignmentStatus = "ACTIVE" | "COMPLETED" | "REASSIGNED" | "CANCELLED";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "OVERTIME";

export interface WorkerContact {
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
}

export interface Worker {
  _id: string;
  id?: string;
  name: string;
  workerType: WorkerType;
  trade: WorkerTrade;
  contractorId?: { _id: string; name: string; code: string } | string | null;
  contact?: WorkerContact;
  status: WorkerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkforceAssignment {
  _id: string;
  id?: string;
  projectId: { _id: string; name: string; code: string; status?: string } | string;
  workerId: Worker | string;
  phaseId?: { _id: string; name: string; sequence: number } | string | null;
  taskId?: { _id: string; title: string; code: string; status: string; plannedQuantity?: number; completedQuantity?: number } | string | null;
  assignedBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  startDate: string;
  endDate?: string | null;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  id?: string;
  projectId: string;
  workerId: Worker | string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workingHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  recordedBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  onLeaveCount: number;
  overtimeCount: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
}
