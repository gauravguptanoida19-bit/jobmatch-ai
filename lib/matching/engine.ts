import { MatchExplanation, MatchWeights } from '@/types';
import { cosineSimilarity } from '@/lib/embeddings/generator';
import { generateExplainabilityWithLLM } from '@/lib/ai/openai';

export const DEFAULT_WEIGHTS: MatchWeights = {
  skills: 0.35,
  semantic: 0.25,
  experience: 0.20,
  education: 0.10,
  preferences: 0.10,
};

const EDUCATION_HIERARCHY: Record<string, number> = {
  phd: 5,
  doctorate: 5,
  master: 4,
  "master's": 4,
  msc: 4,
  bachelor: 3,
  "bachelor's": 3,
  bsc: 3,
  btech: 3,
  associate: 2,
  "associate's": 2,
  bootcamp: 1,
  'high school': 1,
  other: 1,
};

export interface CandidateMatchingInput {
  name: string;
  skills: Array<{ name: string; level?: string; yearsExperience?: number }>;
  yearsOfExperience: number;
  educationLevel: string;
  location?: string;
  remotePreference?: string;
  desiredSalary?: number;
  embedding?: number[] | null;
}

export interface JobMatchingInput {
  title: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  minExperience: number;
  maxExperience: number;
  educationLevel: string;
  location: string;
  remoteType: string;
  minSalary?: number;
  maxSalary?: number;
  embedding?: number[] | null;
}

/**
 * Normalizes skill strings for case-insensitive matching and common synonyms
 */
function normalizeSkill(s: string): string {
  const clean = s.toLowerCase().trim();
  if (clean === 'node' || clean === 'node.js') return 'nodejs';
  if (clean === 'react' || clean === 'react.js') return 'reactjs';
  if (clean === 'next' || clean === 'next.js') return 'nextjs';
  if (clean === 'postgres' || clean === 'postgresql') return 'postgres';
  if (clean === 'k8s' || clean === 'kubernetes') return 'kubernetes';
  if (clean === 'ai' || clean === 'ml' || clean === 'ai/ml' || clean === 'machine learning') return 'aiml';
  return clean;
}

/**
 * Calculates skill compatibility score (0-100)
 */
export function calculateSkillScore(
  candidateSkills: Array<{ name: string; level?: string; yearsExperience?: number }>,
  requiredSkills: string[],
  preferredSkills: string[] = []
): {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
} {
  const candidateMap = new Map<string, { level?: string; yearsExperience?: number }>();
  for (const sk of candidateSkills) {
    candidateMap.set(normalizeSkill(sk.name), sk);
  }

  const matching: string[] = [];
  const missing: string[] = [];

  // Required skills evaluation (75% of skill score)
  let requiredMatchedCount = 0;
  for (const req of requiredSkills) {
    const norm = normalizeSkill(req);
    if (candidateMap.has(norm)) {
      requiredMatchedCount++;
      matching.push(req);
    } else {
      missing.push(req);
    }
  }

  const requiredRatio =
    requiredSkills.length > 0 ? requiredMatchedCount / requiredSkills.length : 1.0;

  // Preferred skills evaluation (25% of skill score)
  let preferredMatchedCount = 0;
  for (const pref of preferredSkills) {
    const norm = normalizeSkill(pref);
    if (candidateMap.has(norm)) {
      preferredMatchedCount++;
      if (!matching.includes(pref)) {
        matching.push(pref);
      }
    } else {
      if (!missing.includes(pref)) {
        missing.push(pref);
      }
    }
  }

  const preferredRatio =
    preferredSkills.length > 0 ? preferredMatchedCount / preferredSkills.length : 1.0;

  // Combined score: 75% required + 25% preferred
  let rawScore = requiredRatio * 75 + preferredRatio * 25;

  // Bonus for candidate proficiency (ADVANCED or EXPERT on matching skills)
  let masteryBonus = 0;
  for (const matchName of matching) {
    const info = candidateMap.get(normalizeSkill(matchName));
    if (info?.level === 'EXPERT' || (info?.yearsExperience && info.yearsExperience >= 4)) {
      masteryBonus += 2;
    }
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore + Math.min(10, masteryBonus))));

  return {
    score: finalScore,
    matchingSkills: matching,
    missingSkills: missing,
  };
}

/**
 * Calculates experience compatibility score (0-100)
 */
export function calculateExperienceScore(
  candidateYears: number,
  minExp: number,
  maxExp: number
): number {
  if (candidateYears >= minExp && candidateYears <= maxExp + 2) {
    return 100;
  }
  if (candidateYears < minExp) {
    if (minExp === 0) return 100;
    const ratio = candidateYears / minExp;
    return Math.max(20, Math.round(ratio * 90));
  }
  // Slightly overqualified
  const overYears = candidateYears - (maxExp + 2);
  const penalty = Math.min(25, overYears * 3);
  return Math.max(75, 100 - penalty);
}

/**
 * Calculates education score (0-100)
 */
export function calculateEducationScore(
  candidateLevel: string,
  requiredLevel: string
): number {
  const normCandidate = candidateLevel.toLowerCase();
  const normRequired = requiredLevel.toLowerCase();

  const cRank = EDUCATION_HIERARCHY[normCandidate] ?? 3;
  const rRank = EDUCATION_HIERARCHY[normRequired] ?? 3;

  if (cRank >= rRank) return 100;
  const diff = rRank - cRank;
  if (diff === 1) return 80;
  if (diff === 2) return 60;
  return 40;
}

/**
 * Calculates preference and location match (0-100)
 */
export function calculatePreferenceScore(params: {
  candidateRemote?: string;
  candidateLocation?: string;
  candidateDesiredSalary?: number;
  jobRemoteType: string;
  jobLocation: string;
  jobMinSalary?: number;
  jobMaxSalary?: number;
}): number {
  let remoteScore = 100;
  const cRemote = (params.candidateRemote || 'HYBRID').toUpperCase();
  const jRemote = (params.jobRemoteType || 'HYBRID').toUpperCase();

  if (jRemote === 'REMOTE') {
    remoteScore = 100;
  } else if (cRemote === 'ANY' || cRemote === jRemote) {
    remoteScore = 100;
  } else if (cRemote === 'REMOTE' && jRemote === 'ONSITE') {
    remoteScore = 40;
  } else {
    remoteScore = 75;
  }

  let locationScore = 90;
  if (
    params.candidateLocation &&
    params.jobLocation &&
    (params.jobLocation.toLowerCase().includes(params.candidateLocation.toLowerCase()) ||
      params.candidateLocation.toLowerCase().includes(params.jobLocation.toLowerCase()))
  ) {
    locationScore = 100;
  }

  let salaryScore = 90;
  if (
    params.candidateDesiredSalary &&
    params.jobMinSalary &&
    params.jobMaxSalary
  ) {
    if (params.candidateDesiredSalary <= params.jobMaxSalary) {
      salaryScore = 100;
    } else {
      const overageRatio =
        (params.candidateDesiredSalary - params.jobMaxSalary) / params.jobMaxSalary;
      salaryScore = Math.max(40, Math.round(100 - overageRatio * 100));
    }
  }

  return Math.round(remoteScore * 0.5 + locationScore * 0.3 + salaryScore * 0.2);
}

/**
 * Main Hybrid Matching Engine:
 * Final Match Score =
 * 35% Skill Match +
 * 25% Semantic Similarity +
 * 20% Experience Match +
 * 10% Education Match +
 * 10% Preference/Location Match
 */
export async function calculateHybridMatch(
  candidate: CandidateMatchingInput,
  job: JobMatchingInput,
  customWeights?: Partial<MatchWeights>
): Promise<MatchExplanation> {
  const weights: MatchWeights = {
    ...DEFAULT_WEIGHTS,
    ...customWeights,
  };

  // 1. Skill Score (35%)
  const skillResult = calculateSkillScore(
    candidate.skills,
    job.requiredSkills,
    job.preferredSkills || []
  );

  // 2. Semantic Similarity (25%)
  let semanticScore = 80;
  if (candidate.embedding && job.embedding) {
    const similarity = cosineSimilarity(candidate.embedding, job.embedding);
    // Convert 0..1 to percentage 0..100
    semanticScore = Math.round(similarity * 100);
  } else {
    // If embeddings are not yet generated, base on skill overlap as baseline
    semanticScore = Math.round(skillResult.score * 0.9 + 10);
  }

  // 3. Experience Match (20%)
  const experienceScore = calculateExperienceScore(
    candidate.yearsOfExperience,
    job.minExperience,
    job.maxExperience
  );

  // 4. Education Match (10%)
  const educationScore = calculateEducationScore(
    candidate.educationLevel,
    job.educationLevel
  );

  // 5. Preferences Match (10%)
  const preferencesScore = calculatePreferenceScore({
    candidateRemote: candidate.remotePreference,
    candidateLocation: candidate.location,
    candidateDesiredSalary: candidate.desiredSalary,
    jobRemoteType: job.remoteType,
    jobLocation: job.location,
    jobMinSalary: job.minSalary,
    jobMaxSalary: job.maxSalary,
  });

  // Calculate Weighted Overall Score
  const overallScore = Math.round(
    skillResult.score * weights.skills +
      semanticScore * weights.semantic +
      experienceScore * weights.experience +
      educationScore * weights.education +
      preferencesScore * weights.preferences
  );

  // Generate explainability insights
  const explanation = await generateExplainabilityWithLLM({
    candidateName: candidate.name,
    candidateSkills: candidate.skills.map((s) => s.name),
    candidateExperienceYears: candidate.yearsOfExperience,
    jobTitle: job.title,
    jobRequiredSkills: job.requiredSkills,
    jobPreferredSkills: job.preferredSkills || [],
    overallScore,
    matchingSkills: skillResult.matchingSkills,
    missingSkills: skillResult.missingSkills,
  });

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    breakdown: {
      skillsMatch: skillResult.score,
      semanticMatch: semanticScore,
      experienceMatch: experienceScore,
      educationMatch: educationScore,
      preferencesMatch: preferencesScore,
    },
    weights,
    matchingSkills: skillResult.matchingSkills,
    missingSkills: skillResult.missingSkills,
    strengths: explanation.strengths,
    recommendations: explanation.recommendations,
    summary: explanation.summary,
  };
}
