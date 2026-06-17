'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalyticsCard } from '@/components/charts/analytics-card';
import { DashboardService } from '@/services/dashboard.service';
import { SubmissionService } from '@/services/submission.service';
import { ExamService } from '@/services/exam.service';

interface SubmissionItem {
  id: string;
  exam_id: string;
  student_name: string;
  student_roll_number: string;
  created_at: string;
  status: string;
  obtained_marks?: number;
  total_marks?: number;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [monitoring, setMonitoring] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionItem[]>([]);
  const [examsMap, setExamsMap] = useState<Record<string, { title: string; subject: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [overviewRes, monitoringRes, submissionsRes, examsRes] = await Promise.all([
          DashboardService.getOverview(),
          DashboardService.getMonitoring(),
          SubmissionService.getSubmissions({ limit: 10 }),
          ExamService.getExams()
        ]);

        if (overviewRes.success) {
          setOverview(overviewRes.data);
        }

        if (monitoringRes.success) {
          setMonitoring(monitoringRes.data);
        }

        // Build a mapping of exam_id -> exam details
        const mapping: Record<string, { title: string; subject: string }> = {};
        if (examsRes.success && Array.isArray(examsRes.data)) {
          examsRes.data.forEach((exam: any) => {
            mapping[exam.id] = { title: exam.title, subject: exam.subject };
          });
          setExamsMap(mapping);
        }

        if (submissionsRes.success && submissionsRes.data) {
          const list = Array.isArray(submissionsRes.data.submissions) 
            ? submissionsRes.data.submissions 
            : (Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
          setRecentSubmissions(list);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError('Could not retrieve dashboard analytics. Please check your backend connection.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatPercentage = (val?: number) => {
    if (val === undefined || val === null) return '--%';
    // If it's already a percentage > 1 (e.g. 85.5) or a ratio < 1 (e.g. 0.855)
    const normalized = val <= 1 && val > 0 ? val * 100 : val;
    return `${normalized.toFixed(1)}%`;
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-brand-secondary text-brand-dark';
      case 'FAILED':
        return 'bg-red-50 text-red-600';
      case 'PROCESSING':
      case 'OCR_COMPLETE':
      case 'UPLOADED':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-brand-primary text-white font-semibold py-2 px-6 rounded-xl hover:bg-opacity-95 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totalExams = overview?.total_exams ?? 0;
  const totalSubmissions = overview?.total_submissions ?? 0;
  const evaluatedSubmissions = overview?.evaluated_submissions ?? 0;
  const averageScore = overview?.average_score ?? 0;
  const averageConfidence = overview?.average_confidence ?? 0;
  const scoreDistribution = monitoring?.score_distribution || {};
  const scoreBars = [
    { label: '90-100', count: scoreDistribution['90-100'] || 0 },
    { label: '80-89', count: scoreDistribution['80-89'] || 0 },
    { label: '70-79', count: scoreDistribution['70-79'] || 0 },
    { label: '60-69', count: scoreDistribution['60-69'] || 0 },
    { label: '<60', count: scoreDistribution.below_60 || 0 },
  ];
  const maxScoreBucket = Math.max(...scoreBars.map((bucket) => bucket.count), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Exams"
          value={totalExams.toString()}
          trend={{ value: 'Live', isPositive: true }}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <AnalyticsCard
          title="Submissions Uploaded"
          value={totalSubmissions.toString()}
          trend={{ value: `${evaluatedSubmissions} Evaluated`, isPositive: true }}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <AnalyticsCard
          title="AI Confidence"
          value={formatPercentage(averageConfidence)}
          variant="primary"
          trend={{ value: 'OCR & Eval', isPositive: true }}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <AnalyticsCard
          title="Class Average"
          value={formatPercentage(averageScore)}
          variant="accent"
          trend={{ value: 'Weighted', isPositive: true }}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Left Column - Charts & Activity */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Evaluation Activity Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(47,90,58,0.05)] border border-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-brand-dark">Score Distribution</h2>
              <span className="text-sm font-semibold text-brand-primary bg-brand-background px-3 py-1 rounded-lg">Live Monitoring</span>
            </div>
            
            {/* Live Chart Visualizer based on recent submissions */}
            <div className="h-64 flex items-end justify-between gap-2 pb-6 border-b border-gray-100 relative">
              <div className="absolute w-full border-t border-dashed border-gray-200 top-0"></div>
              <div className="absolute w-full border-t border-dashed border-gray-200 top-1/2"></div>
              
              {scoreBars.every((bucket) => bucket.count === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                  No completed scores recorded yet.
                </div>
              ) : (
                scoreBars.map((bucket) => {
                  const height = Math.max((bucket.count / maxScoreBucket) * 100, 8);
                  return (
                    <div key={bucket.label} className="w-full flex justify-center group relative z-10">
                      <div 
                        className="w-12 bg-brand-surface rounded-t-lg relative transition-all duration-300 group-hover:bg-brand-primary cursor-pointer"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {bucket.count} submissions
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-between mt-4 text-xs font-medium text-gray-400">
              {scoreBars.map((bucket) => (
                <span key={bucket.label} className="truncate max-w-[60px]">{bucket.label}</span>
              ))}
            </div>
          </div>

          {/* Recent Evaluations Table */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(47,90,58,0.05)] border border-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-brand-dark">Recent Submissions & Evaluations</h2>
              <Link href="/reports" className="text-brand-primary text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-sm font-semibold text-gray-400">Student & Subject</th>
                    <th className="pb-3 text-sm font-semibold text-gray-400">Date</th>
                    <th className="pb-3 text-sm font-semibold text-gray-400">Status</th>
                    <th className="pb-3 text-sm font-semibold text-gray-400 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        No submissions uploaded yet. Go to Upload Center to grade a student sheet.
                      </td>
                    </tr>
                  ) : (
                    recentSubmissions.map((sub, idx) => {
                      const examInfo = examsMap[sub.exam_id] || { title: 'Exam', subject: 'Subject' };
                      return (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-brand-background/50 transition-colors">
                          <td className="py-4">
                            <div className="font-semibold text-brand-dark">{sub.student_name}</div>
                            <div className="text-xs text-gray-400">{examInfo.title} • {examInfo.subject}</div>
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {new Date(sub.created_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(sub.status)}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-4 text-right font-semibold text-brand-primary">
                            {sub.obtained_marks !== null && sub.obtained_marks !== undefined && sub.total_marks 
                              ? `${sub.obtained_marks} / ${sub.total_marks}` 
                              : '--'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Right Column - Quick Actions & Reports */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(47,90,58,0.05)] border border-gray-50">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/upload" className="flex flex-col items-center justify-center p-4 bg-brand-background rounded-xl border border-gray-100 hover:border-brand-primary hover:bg-brand-secondary/30 transition-all group">
                <div className="w-10 h-10 rounded-full bg-brand-surface text-brand-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <span className="text-sm font-semibold text-brand-dark">Upload Sheets</span>
              </Link>
              
              <Link href="/reports" className="flex flex-col items-center justify-center p-4 bg-brand-background rounded-xl border border-gray-100 hover:border-brand-primary hover:bg-brand-secondary/30 transition-all group">
                <div className="w-10 h-10 rounded-full bg-brand-surface text-brand-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="text-sm font-semibold text-brand-dark">View Reports</span>
              </Link>
            </div>
          </div>

          {/* Recent Evaluated Student Reports */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(47,90,58,0.05)] border border-gray-50">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Completed Scorecards</h2>
            <div className="space-y-4">
              {recentSubmissions
                .filter(sub => sub.status.toUpperCase() === 'COMPLETED')
                .slice(0, 3)
                .map((sub, idx) => {
                  const examInfo = examsMap[sub.exam_id] || { title: 'Exam', subject: 'Subject' };
                  return (
                    <Link 
                      key={idx} 
                      href={`/feedback?submissionId=${sub.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-background transition-colors cursor-pointer border border-transparent hover:border-gray-100 block"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs bg-red-50 text-red-500">
                        PDF
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-brand-dark">{sub.student_name}</h4>
                        <p className="text-xs text-gray-500">{examInfo.title}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              {recentSubmissions.filter(sub => sub.status.toUpperCase() === 'COMPLETED').length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No completed scorecards available.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
