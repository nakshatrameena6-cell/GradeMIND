import { apiClient } from './api.client';

export const DashboardService = {
  getOverview: async () => {
    const response = await apiClient.get('/dashboard/overview');
    return {
      success: true,
      data: response.data
    };
  },

  getMonitoring: async () => {
    const response = await apiClient.get('/dashboard/monitoring');
    return {
      success: true,
      data: response.data
    };
  },

  getExamAnalytics: async (examId: string) => {
    const response = await apiClient.get(`/dashboard/exams/${examId}`);
    return {
      success: true,
      data: response.data
    };
  },

  getReview: async (submissionId: string) => {
    const response = await apiClient.get(`/dashboard/submissions/${submissionId}`);
    return {
      success: true,
      data: response.data
    };
  },

  downloadPdf: async (submissionId: string) => {
    const response = await apiClient.get(`/dashboard/submissions/${submissionId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
