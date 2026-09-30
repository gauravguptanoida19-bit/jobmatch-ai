export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export type SkillCategory =
  | 'LANGUAGE'
  | 'FRAMEWORK'
  | 'DATABASE'
  | 'CLOUD'
  | 'TOOL'
  | 'AI_ML'
  | 'OTHER';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  level?: SkillLevel;
  yearsExperience?: number;
}

export interface ExtractedExperience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  years?: number;
  description?: string;
  skillsUsed?: string[];
}

export interface ExtractedEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationYear?: number | string;
}

export interface ExtractedProject {
  name: string;
  description: string;
  skillsUsed?: string[];
  link?: string;
}

export interface ExtractedCertification {
  name: string;
  issuer: string;
  year?: number | string;
}

export interface ParsedResumeData {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  totalYearsExperience: number;
  educationLevel: string;
  skills: ExtractedSkill[];
  experience: ExtractedExperience[];
  education: ExtractedEducation[];
  projects: ExtractedProject[];
  certifications: ExtractedCertification[];
  preferences?: {
    desiredRole?: string;
    remotePreference?: RemoteType;
    desiredSalaryMin?: number;
  };
}

export interface MatchWeights {
  skills: number;       // default: 0.35
  semantic: number;     // default: 0.25
  experience: number;   // default: 0.20
  education: number;    // default: 0.10
  preferences: number;  // default: 0.10
}

export interface MatchExplanation {
  overallScore: number;
  breakdown: {
    skillsMatch: number;
    semanticMatch: number;
    experienceMatch: number;
    educationMatch: number;
    preferencesMatch: number;
  };
  weights: MatchWeights;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  recommendations: string[];
  summary: string;
}

export interface CandidateSearchQuery {
  query: string;
  location?: string;
  remoteType?: RemoteType;
  minExperience?: number;
  skills?: string[];
  limit?: number;
}

export interface JobSearchQuery {
  query: string;
  location?: string;
  remoteType?: RemoteType;
  minSalary?: number;
  type?: JobType;
  limit?: number;
}
