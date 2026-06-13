"use client";

import * as React from "react";
import { Report } from "@/types";
import { ReportService } from "@/services/report.service";

interface ReportsState {
  reports: Report[];
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ReportsContextType extends ReportsState {
  loadReports: () => Promise<void>;
  generateNewReport: (examId: string, format?: Report["format"]) => Promise<void>;
  triggerDownload: (reportId: string) => Promise<void>;
  clearReportsError: () => void;
}

const ReportsContext = React.createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<ReportsState>({
    reports: [],
    isGenerating: false,
    isLoading: false,
    error: null,
  });

  const loadReports = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const reports = await ReportService.listReports();
      setState((prev) => ({ ...prev, reports, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load reports.",
      }));
    }
  };

  const generateNewReport = async (examId: string, format: Report["format"] = "pdf") => {
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));
    try {
      const newReport = await ReportService.generateReport(examId, format);
      setState((prev) => ({
        ...prev,
        reports: [newReport, ...prev.reports],
        isGenerating: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err instanceof Error ? err.message : "Failed to generate report.",
      }));
      throw err;
    }
  };

  const triggerDownload = async (reportId: string) => {
    try {
      const downloadUrl = await ReportService.downloadReport(reportId);
      if (typeof window !== "undefined") {
        window.open(downloadUrl, "_blank");
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to download report.",
      }));
      throw err;
    }
  };

  const clearReportsError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <ReportsContext.Provider
      value={{
        ...state,
        loadReports,
        generateNewReport,
        triggerDownload,
        clearReportsError,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = React.useContext(ReportsContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
};
