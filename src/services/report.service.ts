import { apiClient } from './api.client';

export const ReportService = {
  getReports: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get('/reports', { params: filters });
    return response.data;
  },

  downloadReportPdf: async (reportId: string) => {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    
    // Auto-trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};
