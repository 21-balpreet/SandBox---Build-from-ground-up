export interface ATSScoreResult {
  score: number;
  grade: string;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: {
    priority: "high" | "medium" | "low";
    category: string;
    text: string;
  }[];
}

export interface ResumeGapResult {
  matched_skills: string[];
  missing_skills: string[];
  gap_score: number;
  priority_additions: {
    skill: string;
    reason: string;
    estimated_learning_time: string;
  }[];
  rewrite_suggestions: {
    section: string;
    current_issue: string;
    suggested_fix: string;
  }[];
  overall_summary: string;
}

export interface RejectionInsightResult {
  total_applications: number;
  total_rejections: number;
  rejection_rate: number;
  patterns: {
    pattern_type: string;
    frequency: number;
    description: string;
    suggested_fix: string;
  }[];
  top_missing_skills: string[];
  recommended_job_types: string[];
  recommended_companies: string[];
  overall_advice: string;
}

export interface JobSuggestionsResult {
  suggested_searches: {
    query: string;
    location: string;
    reason: string;
  }[];
  suggested_companies: {
    name: string;
    reason: string;
    fit_score: number;
  }[];
  profile_improvements: string[];
}
