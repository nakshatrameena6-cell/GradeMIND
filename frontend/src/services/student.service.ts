import { apiClient } from './api.client';

export const StudentService = {
  getResultsOverview: async () => {
    const response = await apiClient.get('/student/results');
    return {
      success: true,
      data: response.data
    };
  },

  getSubmissionReview: async (submissionId: string) => {
    const response = await apiClient.get(`/student/results/${submissionId}`);
    return {
      success: true,
      data: response.data
    };
  },

  downloadSubmissionPdf: async (submissionId: string) => {
    const response = await apiClient.get(`/student/results/${submissionId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  publishResults: async (examId: string) => {
    const response = await apiClient.post(`/results/publish/${examId}`);
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  },

  unpublishResults: async (examId: string) => {
    const response = await apiClient.post(`/results/unpublish/${examId}`);
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  }
};

