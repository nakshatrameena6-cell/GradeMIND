"use client";

import * as React from "react";
import { EvaluationJob, EvaluationCriteria, StudentResult } from "@/types";
import { EvaluationService } from "@/services/evaluation.service";

interface EvaluationState {
  activeJob: EvaluationJob | null;
  selectedCriteria: EvaluationCriteria[];
  results: StudentResult[];
  isEvaluating: boolean;
  isLoading: boolean;
  error: string | null;
}

interface EvaluationContextType extends EvaluationState {
  startGrading: (examId: string) => Promise<void>;
  fetchJobStatus: (jobId: string) => Promise<void>;
  fetchResults: (examId: string) => Promise<void>;
  updateCriteriaSelection: (criteria: EvaluationCriteria[]) => void;
  clearEvaluationState: () => void;
}

const EvaluationContext = React.createContext<EvaluationContextType | undefined>(undefined);

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<EvaluationState>({
    activeJob: null,
    selectedCriteria: [],
    results: [],
    isEvaluating: false,
    isLoading: false,
    error: null,
  });

  // Load default criteria on init
  React.useEffect(() => {
    const fetchDefaultCriteria = async () => {
      try {
        const criteria = await EvaluationService.getDefaultCriteria();
        setState((prev) => ({ ...prev, selectedCriteria: criteria }));
      } catch (err) {
        console.error("Failed to load default grading criteria:", err);
      }
    };
    fetchDefaultCriteria();
  }, []);

  const startGrading = async (examId: string) => {
    setState((prev) => ({ ...prev, isEvaluating: true, error: null }));
    try {
      const job = await EvaluationService.startEvaluation(examId, state.selectedCriteria);
      setState((prev) => ({ ...prev, activeJob: job, isEvaluating: true }));

      // Poll/fetch result automatically for mock demo
      setTimeout(() => {
        fetchJobStatus(job.id);
      }, 3000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isEvaluating: false,
        error: err instanceof Error ? err.message : "Failed to start grading job.",
      }));
      throw err;
    }
  };

  const fetchJobStatus = async (jobId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const job = await EvaluationService.getEvaluationJobStatus(jobId);
      setState((prev) => ({
        ...prev,
        activeJob: job,
        results: job.results || [],
        isEvaluating: job.status === "processing",
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to retrieve job status.",
      }));
    }
  };

  const fetchResults = async (examId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const results = await EvaluationService.getExamResults(examId);
      setState((prev) => ({ ...prev, results, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to retrieve exam results.",
      }));
    }
  };

  const updateCriteriaSelection = (criteria: EvaluationCriteria[]) => {
    setState((prev) => ({ ...prev, selectedCriteria: criteria }));
  };

  const clearEvaluationState = () => {
    setState((prev) => ({
      ...prev,
      activeJob: null,
      results: [],
      isEvaluating: false,
      error: null,
    }));
  };

  return (
    <EvaluationContext.Provider
      value={{
        ...state,
        startGrading,
        fetchJobStatus,
        fetchResults,
        updateCriteriaSelection,
        clearEvaluationState,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = React.useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error("useEvaluation must be used within an EvaluationProvider");
  }
  return context;
};
