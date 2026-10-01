import { apiClient } from "./api.js";
import {
  DailyReport,
  CreateDailyReportInput,
  ReviewDailyReportInput,
  DailyReportStatus,
} from "../types/dailyReport.js";

export const dailyReportService = {
  /**
   * Get paginated daily reports for a project
   */
  async getReports(
    projectId: string,
    params?: {
      status?: DailyReportStatus | string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    success: boolean;
    data: DailyReport[];
    meta: { total: number; page: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const qs = searchParams.toString();
    const endpoint = `/projects/${projectId}/daily-reports${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<DailyReport[]>(endpoint);
    return {
      success: res.success,
      data: res.data || [],
      meta: (res.meta as any) || { total: 0, page: 1, totalPages: 1 },
    };
  },

  /**
   * Get single daily report detail
   */
  async getReportById(
    projectId: string,
    reportId: string
  ): Promise<{ success: boolean; data: DailyReport }> {
    const res = await apiClient.get<DailyReport>(`/projects/${projectId}/daily-reports/${reportId}`);
    return {
      success: res.success,
      data: res.data as DailyReport,
    };
  },

  /**
   * Create a new daily report (DPR)
   */
  async createReport(
    projectId: string,
    payload: CreateDailyReportInput
  ): Promise<{ success: boolean; message?: string; data: DailyReport }> {
    const res = await apiClient.post<DailyReport>(`/projects/${projectId}/daily-reports`, payload);
    return {
      success: res.success,
      message: res.message,
      data: res.data as DailyReport,
    };
  },

  /**
   * Review or approve daily report (PM / Admin)
   */
  async reviewReport(
    projectId: string,
    reportId: string,
    payload: ReviewDailyReportInput
  ): Promise<{ success: boolean; message?: string; data: DailyReport }> {
    const res = await apiClient.patch<DailyReport>(
      `/projects/${projectId}/daily-reports/${reportId}/review`,
      payload
    );
    return {
      success: res.success,
      message: res.message,
      data: res.data as DailyReport,
    };
  },

  /**
   * Quick approve daily report (PM / Admin)
   */
  async approveReport(
    projectId: string,
    reportId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; message?: string; data: DailyReport }> {
    const res = await apiClient.patch<DailyReport>(
      `/projects/${projectId}/daily-reports/${reportId}/approve`,
      { reviewNotes }
    );
    return {
      success: res.success,
      message: res.message,
      data: res.data as DailyReport,
    };
  },
};
