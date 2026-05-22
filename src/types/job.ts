export interface Job {
  id: string;
  _id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  stipend?: string;
  duration?: string;
  skills?: string[];
  apply_link?: string;
  posted_date?: string;
  source: "internshala" | "naukri" | "indeed" | "linkedin" | "remotive" | "serpapi" | "manual";
  jobType: "full-time" | "internship" | "remote" | "contract";
  experience_required?: string;
  externalId?: string;
  status: "active" | "expired";
  createdAt?: string;
  updatedAt?: string;
}
