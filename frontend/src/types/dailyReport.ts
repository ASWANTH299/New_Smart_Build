export type WeatherCondition =
  | "SUNNY"
  | "RAINY"
  | "CLOUDY"
  | "STORMY"
  | "WINDY"
  | "HOT"
  | "COLD"
  | "OTHER";

export type DailyReportStatus = "SUBMITTED" | "REVIEWED" | "APPROVED";

export interface MaterialConsumed {
  materialId?: string | null;
  materialName?: string;
  quantity: number;
  unit?: string;
}

export interface DailyReport {
  _id: string;
  projectId: string;
  reportNumber: string;
  date: string;
  reportDate: string;
  weatherCondition: WeatherCondition;
  workPerformed: string;
  laborHeadcount: number;
  equipmentUsed: string[];
  materialsConsumed: MaterialConsumed[];
  photos: string[];
  notes?: string;
  issues?: string[];
  status: DailyReportStatus;
  submittedBy: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role?: string;
    primaryRole?: string;
  };
  reviewedBy?: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role?: string;
    primaryRole?: string;
  } | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyReportInput {
  date?: string;
  weatherCondition?: WeatherCondition;
  workPerformed: string;
  laborHeadcount?: number;
  equipmentUsed?: string[];
  materialsConsumed?: MaterialConsumed[];
  photos?: string[];
  notes?: string;
  issues?: string[];
}

export interface ReviewDailyReportInput {
  status: "REVIEWED" | "APPROVED";
  reviewNotes?: string;
}
