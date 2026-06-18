import { apiClient } from './api.client';

export interface CreateExamData {
  title: string;
  subject: string;
  total_marks: number;
  question_paper_url?: string | null;
  answer_key_url?: string | null;
  evaluation_mode?: 'ANSWER_KEY' | 'AI_AUTONOMOUS';
}

export interface UpdateExamData {
  title?: string;
  subject?: string;
  total_marks?: number;
  question_paper_url?: string | null;
  answer_key_url?: string | null;
  evaluation_mode?: 'ANSWER_KEY' | 'AI_AUTONOMOUS';
}


export const ExamService = {
  getExams: async () => {
    const response = await apiClient.get('/exams');
    // The backend returns {"exams": [...]}. Wrap it so the frontend gets res.data = [...]
    return {
      success: true,
      data: response.data.exams || []
    };
  },

  getExamById: async (examId: string) => {
    const response = await apiClient.get(`/exams/${examId}`);
    return {
      success: true,
      data: response.data
    };
  },

  createExam: async (examData: CreateExamData) => {
    const response = await apiClient.post('/exams', examData);
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  },

  uploadQuestionPaper: async (examId: string, file: File) => {
    const formData = new FormData();
    formData.append('exam_id', examId);
    formData.append('file', file);

    const response = await apiClient.post('/upload/question-paper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return {
      success: true,
      data: response.data.data || response.data,
      ...response.data
    };
  },

  uploadAnswerKey: async (examId: string, file: File) => {
    const formData = new FormData();
    formData.append('exam_id', examId);
    formData.append('file', file);

    const response = await apiClient.post('/upload/answer-key', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return {
      success: true,
      data: response.data.data || response.data,
      ...response.data
    };
  },

  updateExam: async (examId: string, examData: UpdateExamData) => {
    const response = await apiClient.put(`/exams/${examId}`, examData);
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  },

  deleteExam: async (examId: string) => {
    const response = await apiClient.delete(`/exams/${examId}`);
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  }
};

