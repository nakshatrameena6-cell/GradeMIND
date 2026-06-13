import { apiClient } from './api.client';

export const EvaluationService = {
  startEvaluation: async (examId: string) => {
    const response = await apiClient.post(`/evaluations/${examId}/start`);
    return response.data;
  },

  getEvaluationStatus: async (evaluationId: string) => {
    const response = await apiClient.get(`/evaluations/${evaluationId}/status`);
    return response.data;
  }
};
