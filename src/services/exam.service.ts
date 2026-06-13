import { apiClient } from './api.client';

export const ExamService = {
  getExams: async () => {
    const response = await apiClient.get('/exams');
    return response.data;
  },
  
  uploadExam: async (formData: FormData) => {
    const response = await apiClient.post('/exams/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
