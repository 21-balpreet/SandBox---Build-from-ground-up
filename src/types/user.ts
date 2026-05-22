export interface UserExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface UserEducation {
  institution: string;
  degree: string;
  year: string;
  cgpa: string;
}

export interface UserProfile {
  summary?: string;
  skills?: string[];
  experience?: UserExperience[];
  education?: UserEducation[];
  target_roles?: string[];
  target_locations?: string[];
  preferred_job_type?: "full-time" | "internship" | "remote" | "contract" | "any";
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile?: UserProfile;
  savedJobs?: string[];
  createdAt?: string;
}
