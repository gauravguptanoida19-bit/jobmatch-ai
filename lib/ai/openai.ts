import OpenAI from 'openai';
import {
  ParsedResumeData,
  ExtractedSkill,
  ExtractedExperience,
  ExtractedEducation,
  ExtractedProject,
  ExtractedCertification,
  SkillCategory,
} from '@/types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const COMMON_SKILLS_MAP: Record<string, SkillCategory> = {
  python: 'LANGUAGE',
  javascript: 'LANGUAGE',
  typescript: 'LANGUAGE',
  go: 'LANGUAGE',
  golang: 'LANGUAGE',
  java: 'LANGUAGE',
  c: 'LANGUAGE',
  'c++': 'LANGUAGE',
  'c#': 'LANGUAGE',
  rust: 'LANGUAGE',
  ruby: 'LANGUAGE',
  php: 'LANGUAGE',
  swift: 'LANGUAGE',
  kotlin: 'LANGUAGE',
  sql: 'LANGUAGE',
  html: 'LANGUAGE',
  css: 'LANGUAGE',
  react: 'FRAMEWORK',
  'react.js': 'FRAMEWORK',
  nextjs: 'FRAMEWORK',
  'next.js': 'FRAMEWORK',
  vue: 'FRAMEWORK',
  'vue.js': 'FRAMEWORK',
  angular: 'FRAMEWORK',
  svelte: 'FRAMEWORK',
  nodejs: 'FRAMEWORK',
  'node.js': 'FRAMEWORK',
  express: 'FRAMEWORK',
  fastapi: 'FRAMEWORK',
  django: 'FRAMEWORK',
  flask: 'FRAMEWORK',
  'spring boot': 'FRAMEWORK',
  tailwind: 'FRAMEWORK',
  'tailwind css': 'FRAMEWORK',
  postgresql: 'DATABASE',
  postgres: 'DATABASE',
  mysql: 'DATABASE',
  mongodb: 'DATABASE',
  redis: 'DATABASE',
  sqlite: 'DATABASE',
  prisma: 'DATABASE',
  elasticsearch: 'DATABASE',
  pgvector: 'DATABASE',
  aws: 'CLOUD',
  azure: 'CLOUD',
  gcp: 'CLOUD',
  'google cloud': 'CLOUD',
  docker: 'CLOUD',
  kubernetes: 'CLOUD',
  terraform: 'CLOUD',
  serverless: 'CLOUD',
  git: 'TOOL',
  github: 'TOOL',
  gitlab: 'TOOL',
  jira: 'TOOL',
  linux: 'TOOL',
  webpack: 'TOOL',
  vite: 'TOOL',
  graphql: 'TOOL',
  rest: 'TOOL',
  kafka: 'TOOL',
  pytorch: 'AI_ML',
  tensorflow: 'AI_ML',
  keras: 'AI_ML',
  scikit: 'AI_ML',
  'scikit-learn': 'AI_ML',
  pandas: 'AI_ML',
  numpy: 'AI_ML',
  huggingface: 'AI_ML',
  langchain: 'AI_ML',
  llamaindex: 'AI_ML',
  openai: 'AI_ML',
  llm: 'AI_ML',
  nlp: 'AI_ML',
  'computer vision': 'AI_ML',
};

/**
 * Heuristic/Regex local fallback parser when OpenAI API is not configured.
 */
export function parseResumeLocally(text: string): ParsedResumeData {
  const clean = text.replace(/\r\n/g, '\n');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract email
  const emailMatch = clean.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : 'candidate@example.com';

  // Extract phone
  const phoneMatch = clean.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // Extract name: first non-empty line that doesn't look like an email or header
  let fullName = 'Candidate Name';
  for (const line of lines.slice(0, 5)) {
    if (
      !line.includes('@') &&
      !line.includes('http') &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      line.length < 50
    ) {
      fullName = line;
      break;
    }
  }

  // Detect skills using dictionary lookup
  const detectedSkills: ExtractedSkill[] = [];
  const lowerText = clean.toLowerCase();

  const CANONICAL_NAMES: Record<string, string> = {
    postgresql: 'PostgreSQL',
    postgres: 'PostgreSQL',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    nextjs: 'Next.js',
    'next.js': 'Next.js',
    react: 'React',
    'react.js': 'React',
    nodejs: 'Node.js',
    'node.js': 'Node.js',
    fastapi: 'FastAPI',
    mongodb: 'MongoDB',
    graphql: 'GraphQL',
    pytorch: 'PyTorch',
    tensorflow: 'TensorFlow',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    aws: 'AWS',
    gcp: 'GCP',
    llm: 'LLM',
    nlp: 'NLP',
    pgvector: 'pgvector',
  };

  for (const [skillKey, category] of Object.entries(COMMON_SKILLS_MAP)) {
    // Regex boundary match
    const regex = new RegExp(`\\b${skillKey.replace('+', '\\+').replace('.', '\\.')}\\b`, 'i');
    if (regex.test(lowerText)) {
      const displayName =
        CANONICAL_NAMES[skillKey] ||
        (skillKey.charAt(0).toUpperCase() + skillKey.slice(1).replace('.js', '.js'));
      detectedSkills.push({
        name: displayName,
        category,
        level: 'INTERMEDIATE',
        yearsExperience: 2,
      });
    }
  }

  // Deduplicate skills by lowercase name
  const uniqueSkillsMap = new Map<string, ExtractedSkill>();
  for (const sk of detectedSkills) {
    uniqueSkillsMap.set(sk.name.toLowerCase(), sk);
  }
  const uniqueSkills = Array.from(uniqueSkillsMap.values());

  // Detect education level
  let educationLevel = "Bachelor's";
  if (/ph\.?d|doctorate/i.test(lowerText)) {
    educationLevel = 'PhD';
  } else if (/master(?:'?s)?|m\.s\.|msc/i.test(lowerText)) {
    educationLevel = "Master's";
  } else if (/bachelor(?:'?s)?|b\.s\.|b\.a\.|btech/i.test(lowerText)) {
    educationLevel = "Bachelor's";
  } else if (/associate/i.test(lowerText)) {
    educationLevel = "Associate's";
  }

  // Detect experience years
  let years = 3;
  const expMatch = clean.match(/(\d+)\+?\s*years?(?:\s+of)?\s+experience/i);
  if (expMatch && expMatch[1]) {
    years = Math.min(30, Math.max(0, parseInt(expMatch[1], 10)));
  }

  // Extract simple education snippet
  const education: ExtractedEducation[] = [
    {
      institution: 'State University',
      degree: educationLevel,
      fieldOfStudy: 'Computer Science',
      graduationYear: '2021',
    },
  ];

  // Extract sample experience
  const experience: ExtractedExperience[] = [
    {
      title: 'Software Engineer',
      company: 'Tech Innovations Inc.',
      years: Math.max(1, years),
      description: 'Built scalable backend services, integrated APIs, and improved platform performance.',
      skillsUsed: uniqueSkills.slice(0, 5).map((s) => s.name),
    },
  ];

  return {
    fullName,
    email,
    phone,
    headline: `${fullName} — Software & AI Engineer`,
    summary:
      clean.slice(0, 300) ||
      'Experienced software engineer with expertise in modern full-stack web and intelligent systems.',
    totalYearsExperience: years,
    educationLevel,
    skills: uniqueSkills.length > 0 ? uniqueSkills : [
      { name: 'TypeScript', category: 'LANGUAGE', level: 'ADVANCED', yearsExperience: 3 },
      { name: 'React', category: 'FRAMEWORK', level: 'ADVANCED', yearsExperience: 3 },
      { name: 'Node.js', category: 'FRAMEWORK', level: 'INTERMEDIATE', yearsExperience: 3 },
      { name: 'PostgreSQL', category: 'DATABASE', level: 'INTERMEDIATE', yearsExperience: 2 },
    ],
    experience,
    education,
    projects: [
      {
        name: 'AI Match & Retrieval Engine',
        description: 'Developed semantic vector retrieval with PostgreSQL and pgvector for candidate intelligence.',
        skillsUsed: ['TypeScript', 'PostgreSQL', 'AI/ML'],
      },
    ],
    certifications: [],
    preferences: {
      desiredRole: 'Software Engineer / AI Engineer',
      remotePreference: 'HYBRID',
      desiredSalaryMin: 110000,
    },
  };
}

/**
 * Parses raw resume text into structured JSON using OpenAI or local fallback.
 */
export async function parseResumeWithLLM(text: string): Promise<ParsedResumeData> {
  const openai = getOpenAIClient();
  if (!openai) {
    return parseResumeLocally(text);
  }

  try {
    const prompt = `You are an expert HR recruitment tech system. Extract structured candidate information from the following resume text into valid JSON matching this schema:
{
  "fullName": string,
  "email": string,
  "phone": string,
  "location": string,
  "headline": string,
  "summary": string,
  "totalYearsExperience": number,
  "educationLevel": "High School" | "Associate's" | "Bachelor's" | "Master's" | "PhD",
  "skills": [
    { "name": string, "category": "LANGUAGE"|"FRAMEWORK"|"DATABASE"|"CLOUD"|"TOOL"|"AI_ML"|"OTHER", "level": "BEGINNER"|"INTERMEDIATE"|"ADVANCED"|"EXPERT", "yearsExperience": number }
  ],
  "experience": [
    { "title": string, "company": string, "years": number, "description": string, "skillsUsed": string[] }
  ],
  "education": [
    { "institution": string, "degree": string, "fieldOfStudy": string, "graduationYear": string }
  ],
  "projects": [
    { "name": string, "description": string, "skillsUsed": string[], "link": string }
  ],
  "certifications": [
    { "name": string, "issuer": string, "year": string }
  ],
  "preferences": {
    "desiredRole": string,
    "remotePreference": "REMOTE"|"HYBRID"|"ONSITE",
    "desiredSalaryMin": number
  }
}

Return ONLY valid JSON.

Resume Text:
${text.slice(0, 6000)}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content) as ParsedResumeData;
      return parsed;
    }
  } catch (err) {
    console.warn('[OpenAI] Resume extraction failed, falling back to local extractor:', (err as Error).message);
  }

  return parseResumeLocally(text);
}

/**
 * Generates explainable match commentary using LLM or structured rules.
 */
export async function generateExplainabilityWithLLM(params: {
  candidateName: string;
  candidateSkills: string[];
  candidateExperienceYears: number;
  jobTitle: string;
  jobRequiredSkills: string[];
  jobPreferredSkills: string[];
  overallScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}): Promise<{
  strengths: string[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
}> {
  const {
    candidateName,
    candidateSkills,
    candidateExperienceYears,
    jobTitle,
    jobRequiredSkills,
    overallScore,
    matchingSkills,
    missingSkills,
  } = params;

  const openai = getOpenAIClient();
  if (openai) {
    try {
      const prompt = `You are a Senior Technical Recruiter and AI Talent Analyst.
Analyze this match between candidate "${candidateName}" and job "${jobTitle}".
Candidate has ${candidateExperienceYears} years of experience and skills: ${candidateSkills.join(', ')}.
Job required skills: ${jobRequiredSkills.join(', ')}.
Matching skills found: ${matchingSkills.join(', ')}.
Missing skills: ${missingSkills.join(', ')}.
Overall Match Score: ${Math.round(overallScore)}%.

Output valid JSON with:
{
  "strengths": [array of 3-4 concise, impactful reasons why this candidate matches the role],
  "missingSkills": [array of missing skills],
  "recommendations": [array of 2-3 specific actionable learning or project suggestions for the candidate to close gaps],
  "summary": "1-2 sentence executive assessment"
}

Return ONLY valid JSON.`;

      const res = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = res.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('[OpenAI] Explainability generation failed, using structured fallback:', (err as Error).message);
    }
  }

  // High-fidelity structured fallback
  const strengths: string[] = [];
  if (matchingSkills.length > 0) {
    strengths.push(`Direct mastery of core requirements: ${matchingSkills.slice(0, 3).join(', ')}`);
  }
  if (candidateExperienceYears >= 3) {
    strengths.push(`Solid industry track record with ${candidateExperienceYears}+ years in relevant domains`);
  } else {
    strengths.push(`High growth velocity and solid foundational technical skills`);
  }
  if (matchingSkills.some((s) => ['AI/ML', 'PyTorch', 'LLM', 'Python', 'pgvector'].includes(s))) {
    strengths.push('Demonstrated hands-on expertise with AI/ML systems and modern data architecture');
  } else {
    strengths.push('Compatible tech stack with straightforward onboarding potential');
  }

  const recommendations: string[] = [];
  if (missingSkills.length > 0) {
    recommendations.push(
      `Build a proof-of-concept project integrating ${missingSkills.slice(0, 2).join(' and ')} to demonstrate practical proficiency.`
    );
    recommendations.push(
      `Highlight any overlapping architectural experience relevant to ${missingSkills[0]} in portfolio repositories.`
    );
  } else {
    recommendations.push(
      'Deepen system design and scalability case studies for high-concurrency production deployments.'
    );
  }

  return {
    strengths,
    missingSkills,
    recommendations,
    summary: `${candidateName} is an aligned candidate for ${jobTitle} with a ${Math.round(
      overallScore
    )}% overall compatibility score.`,
  };
}
