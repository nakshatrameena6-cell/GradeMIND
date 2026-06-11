"""
GradeMIND Report Data Builder.
Prepares structured data payloads for PDF Generation, Analytics,
Teacher Dashboards, and Student Dashboards from evaluation outputs.
"""

import logging
from typing import List, Dict, Any
from AI.schemas.evaluation_schema import SubmissionEvaluation

logger = logging.getLogger("GradeMIND.ReportBuilder")


class ReportDataBuilder:
    """
    Compiler of specialized reporting models for various presentation channels.
    """
    def __init__(self):
        pass

    def build_pdf_payload(self, evaluation: SubmissionEvaluation) -> Dict[str, Any]:
        """
        Builds a layout-ready dictionary structure for PDF generation.
        
        Args:
            evaluation: SubmissionEvaluation Pydantic model.
            
        Returns:
            Dictionary containing structured layout fields.
        """
        logger.info(f"Building PDF payload for submission {evaluation.submission_id}")
        
        question_rows = []
        for q in evaluation.questions:
            question_rows.append({
                "question_number": q.question_number,
                "max_marks": q.max_marks,
                "score_awarded": q.score_awarded,
                "confidence": f"{q.confidence:.2%}",
                "feedback": q.criteria_feedback
            })

        return {
            "document_title": f"GradeMIND Evaluation Report Card",
            "submission_id": evaluation.submission_id,
            "status": evaluation.status,
            "overall_summary": {
                "total_score": evaluation.total_score,
                "max_possible": evaluation.max_possible,
                "percentage": f"{(evaluation.total_score / evaluation.max_possible * 100):.1f}%" if evaluation.max_possible > 0 else "0.0%",
                "confidence_score": f"{evaluation.confidence_score:.2%}",
                "fairness_index": f"{evaluation.fairness_score:.2%}"
            },
            "grading_breakdown": question_rows,
            "constructive_feedback": {
                "strengths": evaluation.strengths,
                "weaknesses": evaluation.weaknesses,
                "improvements": evaluation.improvements,
                "summary": evaluation.summary
            }
        }

    def build_analytics(self, evaluations: List[SubmissionEvaluation]) -> Dict[str, Any]:
        """
        Compiles aggregate statistics across a cohort of submissions.
        
        Args:
            evaluations: List of SubmissionEvaluation objects.
            
        Returns:
            Analytics dictionary containing class metrics.
        """
        if not evaluations:
            return {
                "total_submissions": 0,
                "class_average": 0.0,
                "highest_score": 0.0,
                "lowest_score": 0.0,
                "distribution": {
                    "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "below_60": 0
                }
            }

        total_submissions = len(evaluations)
        scores = []
        highest = 0.0
        lowest = float('inf')
        
        distribution = {
            "90-100": 0,
            "80-89": 0,
            "70-79": 0,
            "60-69": 0,
            "below_60": 0
        }

        for eval_item in evaluations:
            total = eval_item.total_score
            max_p = eval_item.max_possible
            percentage = (total / max_p * 100.0) if max_p > 0 else 0.0
            
            scores.append(percentage)
            
            if total > highest:
                highest = total
            if total < lowest:
                lowest = total

            # Categorize brackets
            if percentage >= 90:
                distribution["90-100"] += 1
            elif percentage >= 80:
                distribution["80-89"] += 1
            elif percentage >= 70:
                distribution["70-79"] += 1
            elif percentage >= 60:
                distribution["60-69"] += 1
            else:
                distribution["below_60"] += 1

        lowest = lowest if lowest != float('inf') else 0.0
        class_average = sum(scores) / total_submissions if total_submissions > 0 else 0.0

        return {
            "total_submissions": total_submissions,
            "class_average": round(class_average, 2),
            "highest_score": round(highest, 2),
            "lowest_score": round(lowest, 2),
            "distribution": distribution
        }

    def build_teacher_dashboard(self, evaluations: List[SubmissionEvaluation]) -> Dict[str, Any]:
        """
        Prepares dashboard views for course instructors.
        Identifies submissions requiring manual override/review.
        
        Args:
            evaluations: List of SubmissionEvaluation objects.
            
        Returns:
            Teacher dashboard data structure.
        """
        submissions_summary = []
        review_required = []

        for eval_item in evaluations:
            pct = (eval_item.total_score / eval_item.max_possible * 100.0) if eval_item.max_possible > 0 else 0.0
            
            summary_entry = {
                "submission_id": eval_item.submission_id,
                "score_awarded": eval_item.total_score,
                "max_possible": eval_item.max_possible,
                "percentage": round(pct, 2),
                "confidence_score": eval_item.confidence_score,
                "status": eval_item.status
            }
            
            submissions_summary.append(summary_entry)
            
            # Review flag conditions: Low AI confidence (< 0.70) or fairness failures
            if eval_item.confidence_score < 0.70 or not eval_item.fairness_verified or eval_item.status == "PENDING_REVIEW":
                review_required.append({
                    "submission_id": eval_item.submission_id,
                    "reason": (
                        "Low AI Confidence" if eval_item.confidence_score < 0.70 else "Fairness Check Warning"
                    ),
                    "confidence_score": eval_item.confidence_score
                })

        # Calculate cohort average
        analytics_summary = self.build_analytics(evaluations)

        return {
            "total_students": len(evaluations),
            "class_average_percentage": analytics_summary["class_average"],
            "submissions": submissions_summary,
            "review_queue": review_required,
            "review_queue_count": len(review_required),
            "score_distribution": analytics_summary["distribution"]
        }

    def build_student_dashboard(self, evaluation: SubmissionEvaluation) -> Dict[str, Any]:
        """
        Prepares diagnostic dashboard views customized for the student.
        
        Args:
            evaluation: SubmissionEvaluation object.
            
        Returns:
            Student dashboard data structure.
        """
        percentage = (evaluation.total_score / evaluation.max_possible * 100.0) if evaluation.max_possible > 0 else 0.0
        
        # Build question list
        question_grades = []
        for q in evaluation.questions:
            q_pct = (q.score_awarded / q.max_marks * 100.0) if q.max_marks > 0 else 0.0
            question_grades.append({
                "question_number": q.question_number,
                "score": q.score_awarded,
                "max_marks": q.max_marks,
                "percentage": round(q_pct, 2),
                "feedback": q.criteria_feedback
            })

        return {
            "submission_id": evaluation.submission_id,
            "score_awarded": evaluation.total_score,
            "max_possible": evaluation.max_possible,
            "score_percentage": round(percentage, 2),
            "strengths": evaluation.strengths,
            "improvements": evaluation.improvements,
            "summary_comment": evaluation.summary,
            "questions_grades": question_grades
        }
