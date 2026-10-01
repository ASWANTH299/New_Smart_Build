import { apiClient, getApiBaseUrl } from "./api.js";
import { ProjectAnalytics, ReportExportFormat } from "../types/report.js";

export const reportService = {
  /**
   * Get real-time aggregated project analytics
   */
  async getProjectAnalytics(
    projectId: string
  ): Promise<{ success: boolean; data: ProjectAnalytics }> {
    const res = await apiClient.get<ProjectAnalytics>(
      `/projects/${projectId}/reports/analytics`
    );
    return {
      success: res.success,
      data: res.data as ProjectAnalytics,
    };
  },

  /**
   * Export project summary report as CSV or JSON
   */
  async exportProjectReport(
    projectId: string,
    format: ReportExportFormat = "csv"
  ): Promise<void> {
    const baseUrl = getApiBaseUrl();
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("smart_build_token")
        : null;

    const response = await fetch(
      `${baseUrl}/projects/${projectId}/reports/export?format=${format}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export report");
    }

    if (format === "csv") {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-analytics-${projectId}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const json = await response.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-analytics-${projectId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  },
};

export default reportService;
