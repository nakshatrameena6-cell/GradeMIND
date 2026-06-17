'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Download, Eye, FileText, X, CheckCircle2, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SubmissionService } from '@/services/submission.service';
import { ExamService } from '@/services/exam.service';

export default function ReportsCenter() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [examsMap, setExamsMap] = useState<Record<string, any>>({});
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch submissions and exams
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [subsRes, examsRes] = await Promise.all([
        SubmissionService.getSubmissions({ limit: 100 }),
        ExamService.getExams()
      ]);

      let subsList = [];
      if (subsRes.success && subsRes.data) {
        subsList = subsRes.data.submissions || subsRes.data || [];
      }
      setSubmissions(subsList);

      const map: Record<string, any> = {};
      const subjectSet = new Set<string>();
      if (examsRes.success && Array.isArray(examsRes.data)) {
        examsRes.data.forEach((ex: any) => {
          map[ex.id] = ex;
          if (ex.subject) subjectSet.add(ex.subject);
        });
      }
      setExamsMap(map);
      setSubjects(['All', ...Array.from(subjectSet)]);
    } catch (err: any) {
      console.error('Failed to load reports data:', err);
      setError('Could not connect to the backend server. Make sure the FastAPI application is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this evaluation report?')) return;

    try {
      const res = await SubmissionService.deleteSubmission(id);
      if (res.success || res.status === 'success') {
        setSubmissions(prev => prev.filter(sub => sub.id !== id));
      } else {
        alert('Failed to delete report: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the report.');
    }
  };

  const handleDownloadPDF = (id: string, roll: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('grademind_auth='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : '';
    
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/submissions/${id}/pdf?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  // Filter reports
  const filteredReports = submissions.filter(report => {
    const exam = examsMap[report.exam_id] || {};
    const matchesSearch = 
      (report.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (report.student_roll_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === 'All' || exam.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-brand-primary" />
            </div>
            Reports Center
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and export AI-generated evaluation reports.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search student, roll, exam..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm text-sm"
            />
          </div>
          
          {/* Filter */}
          <div className="relative">
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="appearance-none pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm text-brand-dark font-medium min-w-[160px] cursor-pointer text-sm"
            >
              {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(47,90,58,0.05)] border border-gray-50 overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
            <p className="text-gray-500 font-semibold text-sm">Fetching evaluation records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-background/50 border-b border-gray-100">
                  <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Exam / Subject</th>
                  <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.map((report) => {
                  const exam = examsMap[report.exam_id] || {};
                  const isCompleted = report.status === 'COMPLETED';

                  return (
                    <tr 
                      key={report.id} 
                      onClick={() => isCompleted && router.push(`/results?submissionId=${report.id}`)}
                      className={`hover:bg-brand-background/30 transition-colors group ${isCompleted ? 'cursor-pointer' : ''}`}
                    >
                      <td className="py-4 px-6 font-bold text-brand-dark">{report.student_name}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {report.student_roll_number}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-brand-dark text-sm">{exam.title || 'Exam unavailable'}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{exam.subject || 'Subject unavailable'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-brand-dark">
                            {report.obtained_marks !== null ? report.obtained_marks : '--'}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">/ {report.total_marks || 100}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          report.status === 'COMPLETED' ? 'bg-[#EEF7E8] text-[#2F5A3A]' :
                          report.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700 animate-pulse'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isCompleted && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/results?submissionId=${report.id}`);
                                }}
                                className="p-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                                title="View Insights"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={(e) => handleDownloadPDF(report.id, report.student_roll_number, e)}
                                className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={(e) => handleDelete(report.id, e)}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-500 font-medium">
                      No reports found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
