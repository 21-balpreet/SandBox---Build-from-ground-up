import { Job } from "./job";

export interface TimelineEvent {
  status: string;
  date: string;
  notes?: string;
}

export interface AIFeedback {
  rejection_reason?: string;
  improvement_suggestions?: string[];
  resume_match_score?: number;
}

export interface JobApplication {
  id: string;
  _id: string;
  user: string;
  job: Job | null;

  manual_title?: string;
  manual_company?: string;
  manual_location?: string;
  manual_apply_link?: string;

  application_type: "off-campus" | "campus-placement" | "referral" | "hackathon";
  status: "saved" | "applied" | "assessment" | "interview-1" | "interview-2" | "interview-3" | "offered" | "rejected" | "withdrawn";
  applied_date?: string;

  campus_drive_date?: string;
  campus_company_visited?: string;

  referral_person_name?: string;
  referral_person_linkedin?: string;
  referral_status: "pending" | "responded" | "ignored";

  hackathon_name?: string;
  hackathon_result?: string;

  timeline: TimelineEvent[];
  ai_feedback?: AIFeedback;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
