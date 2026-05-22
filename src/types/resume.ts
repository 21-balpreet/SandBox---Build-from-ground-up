export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  photoUrl?: string; // Persistent Base64 photo string
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  score: string; // CGPA/GPA e.g. "8.8" or "88%"
  period: string; // duration e.g. "Aug 2022 - May 2026"
  location: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  technologies: string;
  duration: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  category: string; // e.g. "Languages", "Frameworks"
  items: string; // e.g. "Java, C++, React"
}

export interface CustomSection {
  id: string;
  title: string; // e.g. "Certifications", "Achievements"
  bullets: string[];
}

export interface ResumeData {
  contact: ContactInfo;
  education: EducationEntry[];
  skills: SkillCategory[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  customSections: CustomSection[];
}

export type TemplateType = "bvimit" | "classic" | "minimalist";
