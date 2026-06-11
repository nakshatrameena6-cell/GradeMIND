"""
GradeMIND Feedback Agent.
Analyzes rubric evaluation outcomes to generate constructive student feedback lists
covering strengths, weaknesses, improvements, and overall summary comments.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger("GradeMIND.Feedback")


def generate_strengths(evaluation_result: Dict[str, Any]) -> List[str]:
    """
    Identify conceptual areas where the student scored maximum or high marks.
    
    Args:
        evaluation_result: Dictionary containing question evaluation or rubric points.
        
    Returns:
        List of strength description strings.
    """
    strengths = []
    
    # Check if this is a submission evaluation containing multiple questions
    questions = evaluation_result.get("questions", [])
    if questions:
        for q in questions:
            q_num = q.get("question_number", "")
            pts = q.get("rubric_points", [])
            for pt in pts:
                if pt.get("met", False) or pt.get("marks_awarded", 0.0) >= (pt.get("allocated_marks", 0.0) * 0.8):
                    strengths.append(f"Q{q_num}: Strong coverage of '{pt.get('description')}'")
    else:
        # Check single question criteria points
        pts = evaluation_result.get("matched_points", evaluation_result.get("rubric_points", []))
        for pt in pts:
            if pt.get("met", False) or pt.get("marks_awarded", 0.0) >= (pt.get("allocated_marks", 0.0) * 0.8):
                strengths.append(f"Demonstrated clear understanding of: {pt.get('description')}")

    if not strengths:
        strengths.append("Attempted all questions and displayed initial understanding of the prompt structures.")
        
    # De-duplicate and limit
    return list(dict.fromkeys(strengths))[:3]


def generate_weaknesses(evaluation_result: Dict[str, Any]) -> List[str]:
    """
    Identify criteria points that the student missed or scored low marks on.
    
    Args:
        evaluation_result: Dictionary containing question evaluation or rubric points.
        
    Returns:
        List of weakness description strings.
    """
    weaknesses = []
    
    questions = evaluation_result.get("questions", [])
    if questions:
        for q in questions:
            q_num = q.get("question_number", "")
            pts = q.get("rubric_points", [])
            for pt in pts:
                if not pt.get("met", False) and pt.get("marks_awarded", 0.0) < (pt.get("allocated_marks", 0.0) * 0.5):
                    weaknesses.append(f"Q{q_num}: Gaps in explaining '{pt.get('description')}'")
    else:
        pts = evaluation_result.get("matched_points", evaluation_result.get("rubric_points", []))
        for pt in pts:
            if not pt.get("met", False) and pt.get("marks_awarded", 0.0) < (pt.get("allocated_marks", 0.0) * 0.5):
                weaknesses.append(f"Lacks detailed elaboration on: {pt.get('description')}")

    if not weaknesses:
        weaknesses.append("No major conceptual gaps identified in the evaluated responses.")
        
    return list(dict.fromkeys(weaknesses))[:3]


def generate_improvements(evaluation_result: Dict[str, Any]) -> List[str]:
    """
    Generate actionable advice based on identified weaknesses.
    
    Args:
        evaluation_result: Dictionary containing question evaluation or rubric points.
        
    Returns:
        List of actionable improvement advice strings.
    """
    improvements = []
    
    questions = evaluation_result.get("questions", [])
    if questions:
        for q in questions:
            q_num = q.get("question_number", "")
            pts = q.get("rubric_points", [])
            for pt in pts:
                if not pt.get("met", False):
                    desc = pt.get("description", "").lower()
                    improvements.append(f"Q{q_num}: Review standard definitions and context for {desc}.")
    else:
        pts = evaluation_result.get("matched_points", evaluation_result.get("rubric_points", []))
        for pt in pts:
            if not pt.get("met", False):
                desc = pt.get("description", "").lower()
                improvements.append(f"Ensure to write steps outlining: {desc}.")

    if not improvements:
        improvements.append("Continue to practice advanced questions to build upon your current mastery.")
        
    return list(dict.fromkeys(improvements))[:3]


def generate_summary(evaluation_result: Dict[str, Any]) -> str:
    """
    Synthesize strengths, weaknesses, and scores into a coherent paragraph.
    
    Args:
        evaluation_result: The evaluation results payload.
        
    Returns:
        A paragraph summary string.
    """
    strengths = generate_strengths(evaluation_result)
    weaknesses = generate_weaknesses(evaluation_result)
    
    # Fetch total details
    total = evaluation_result.get("total_score", 0.0)
    max_p = evaluation_result.get("max_possible", 100.0)
    percentage = (total / max_p * 100) if max_p > 0 else 0.0
    
    summary = f"Student achieved a score of {total}/{max_p} ({percentage:.1f}%). "
    
    if strengths and "Attempted all questions" not in strengths[0]:
        summary += f"The submission shows strong performance in several areas, notably: {', '.join(s.replace('Demonstrated clear understanding of: ', '') for s in strengths)}. "
    else:
        summary += "The response displays initial familiarity with the subject, but could benefit from broader concept coverage. "
        
    if weaknesses and "No major conceptual gaps" not in weaknesses[0]:
        summary += f"For future success, attention should be given to resolving gaps in: {', '.join(w.replace('Lacks detailed elaboration on: ', '') for w in weaknesses)}."
    else:
        summary += "Excellent job adhering to the grading rubric guidelines!"

    return summary


def compile_feedback(evaluation_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compiles strengths, weaknesses, improvements, and summary into the final standard output format.
    
    Args:
        evaluation_result: Raw evaluation outcome dataset.
        
    Returns:
        Structured feedback dictionary.
    """
    return {
        "strengths": generate_strengths(evaluation_result),
        "weaknesses": generate_weaknesses(evaluation_result),
        "improvements": generate_improvements(evaluation_result),
        "summary": generate_summary(evaluation_result)
    }
