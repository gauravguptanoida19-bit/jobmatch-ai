import { generateDeterministicEmbedding, cosineSimilarity } from '@/lib/embeddings/generator';
import { calculateHybridMatch } from '@/lib/matching/engine';
import { ParsedResumeData } from '@/types';

export interface MockSkill {
  id: string;
  name: string;
  category: string;
}

export interface MockJobSkill {
  id: string;
  jobId: string;
  skillId: string;
  skill: MockSkill;
  isRequired: boolean;
}

export interface MockJob {
  id: string;
  title: string;
  company: string;
  department?: string;
  location: string;
  type: string;
  remoteType: string;
  minExperience: number;
  maxExperience: number;
  educationLevel: string;
  minSalary: number;
  maxSalary: number;
  description: string;
  requirements?: string;
  benefits?: string;
  status: string;
  embedding: number[];
  skills: MockJobSkill[];
  createdAt: string;
  _count: { applications: number };
}

export interface MockCandidateSkill {
  id: string;
  skillId: string;
  skill: MockSkill;
  level: string;
  yearsExperience: number;
}

export interface MockCandidate {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  headline: string;
  bio: string;
  location: string;
  yearsOfExperience: number;
  educationLevel: string;
  remotePreference: string;
  desiredSalary: number;
  skills: MockCandidateSkill[];
  resumes: Array<{
    id: string;
    fileName: string;
    rawText: string;
    parsedData: ParsedResumeData;
    embedding: number[];
    createdAt: string;
  }>;
  applications: Array<{
    id: string;
    jobId: string;
    job: { title: string; company: string };
    status: string;
    matchScore: number;
    createdAt: string;
    coverLetter?: string;
  }>;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'CANDIDATE' | 'RECRUITER';
  candidateProfileId?: string;
  recruiterProfileId?: string;
}


const RAW_SKILLS = [
  { name: 'Python', category: 'LANGUAGE' },
  { name: 'TypeScript', category: 'LANGUAGE' },
  { name: 'JavaScript', category: 'LANGUAGE' },
  { name: 'Go', category: 'LANGUAGE' },
  { name: 'SQL', category: 'LANGUAGE' },
  { name: 'React', category: 'FRAMEWORK' },
  { name: 'Next.js', category: 'FRAMEWORK' },
  { name: 'Node.js', category: 'FRAMEWORK' },
  { name: 'FastAPI', category: 'FRAMEWORK' },
  { name: 'PostgreSQL', category: 'DATABASE' },
  { name: 'pgvector', category: 'DATABASE' },
  { name: 'Redis', category: 'DATABASE' },
  { name: 'Docker', category: 'CLOUD' },
  { name: 'Kubernetes', category: 'CLOUD' },
  { name: 'AWS', category: 'CLOUD' },
  { name: 'Terraform', category: 'CLOUD' },
  { name: 'CI/CD', category: 'CLOUD' },
  { name: 'PyTorch', category: 'AI_ML' },
  { name: 'LLM', category: 'AI_ML' },
  { name: 'LangChain', category: 'AI_ML' },
  { name: 'Kafka', category: 'TOOL' },
  { name: 'Tailwind CSS', category: 'FRAMEWORK' },
];

const RAW_JOBS = [
  {
    id: 'job-1',
    title: 'Senior AI & LLM Systems Engineer',
    company: 'Nexus AI Labs',
    department: 'Core Machine Learning',
    location: 'San Francisco, CA',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 4,
    maxExperience: 8,
    educationLevel: "Master's",
    minSalary: 160000,
    maxSalary: 220000,
    description:
      'Architect low-latency vector retrieval pipelines, fine-tune open-weights models, and productionize pgvector semantic search clusters.',
    required: ['Python', 'PyTorch', 'PostgreSQL', 'pgvector', 'LLM'],
    preferred: ['Docker', 'Kubernetes', 'Kafka', 'LangChain'],
  },
  {
    id: 'job-2',
    title: 'Lead Full Stack Engineer (Next.js 15)',
    company: 'Hyperscale Technologies',
    department: 'Platform Engineering',
    location: 'New York, NY',
    remoteType: 'HYBRID',
    type: 'FULL_TIME',
    minExperience: 5,
    maxExperience: 9,
    educationLevel: "Bachelor's",
    minSalary: 155000,
    maxSalary: 205000,
    description:
      'Lead full-stack engineering initiatives building responsive, high-velocity dashboards using Next.js 15 App Router, React 19, Tailwind CSS, and PostgreSQL relational backends.',
    required: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'Node.js'],
    preferred: ['Tailwind CSS', 'Docker', 'AWS'],
  },
  {
    id: 'job-3',
    title: 'Cloud Platform & Kubernetes Engineer',
    company: 'Orbit Cloud Infrastructure',
    department: 'DevOps & Reliability',
    location: 'Austin, TX',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 3,
    maxExperience: 7,
    educationLevel: "Bachelor's",
    minSalary: 140000,
    maxSalary: 185000,
    description:
      'Scale our multi-region Kubernetes clusters on AWS using Terraform infrastructure-as-code, automated GitHub Actions pipelines, and Prometheus monitoring.',
    required: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
    preferred: ['Go', 'Kafka', 'Python'],
  },
  {
    id: 'job-4',
    title: 'Senior Backend Platform Engineer',
    company: 'Stripe Horizon',
    department: 'Payment Infrastructure',
    location: 'Seattle, WA',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 5,
    maxExperience: 9,
    educationLevel: "Bachelor's",
    minSalary: 165000,
    maxSalary: 215000,
    description:
      'Architect resilient, distributed transaction processing APIs handling billions of requests monthly. Optimize PostgreSQL schemas and Redis caching clusters.',
    required: ['Python', 'PostgreSQL', 'SQL', 'Redis', 'Docker'],
    preferred: ['Kafka', 'Go', 'AWS'],
  },
  {
    id: 'job-5',
    title: 'Data & Vector Pipeline Engineer',
    company: 'VectorFlow Data',
    department: 'Search Architecture',
    location: 'San Jose, CA',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 3,
    maxExperience: 7,
    educationLevel: "Bachelor's",
    minSalary: 145000,
    maxSalary: 190000,
    description:
      'Build ETL pipelines processing millions of unstructured documents into multi-dimensional embeddings with PostgreSQL pgvector and vector index tuning (HNSW/IVFFlat).',
    required: ['Python', 'PostgreSQL', 'pgvector', 'SQL', 'Docker'],
    preferred: ['PyTorch', 'Kafka', 'AWS'],
  },
  {
    id: 'job-6',
    title: 'Frontend Architecture Engineer',
    company: 'Craft Studio',
    department: 'Product Design Systems',
    location: 'San Francisco, CA',
    remoteType: 'HYBRID',
    type: 'FULL_TIME',
    minExperience: 4,
    maxExperience: 8,
    educationLevel: "Bachelor's",
    minSalary: 145000,
    maxSalary: 185000,
    description:
      'Develop modular component systems, fluid micro-interactions, and accessible interactive workflows using React, TypeScript, and modern CSS.',
    required: ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript'],
    preferred: ['Next.js', 'Node.js'],
  },
  {
    id: 'job-7',
    title: 'AI Product Engineer (LangChain & Next.js)',
    company: 'Cognitive Engine Co.',
    department: 'Applied AI',
    location: 'San Francisco, CA',
    remoteType: 'HYBRID',
    type: 'FULL_TIME',
    minExperience: 2,
    maxExperience: 5,
    educationLevel: "Bachelor's",
    minSalary: 130000,
    maxSalary: 175000,
    description:
      'Bridge machine learning capabilities with delightful user experiences. Implement multi-agent workflows, prompt chains, and realtime conversational streaming in Next.js.',
    required: ['Next.js', 'TypeScript', 'LangChain', 'React'],
    preferred: ['Python', 'PostgreSQL', 'Tailwind CSS'],
  },
  {
    id: 'job-8',
    title: 'Junior / Associate Full Stack Developer',
    company: 'Innovate Sparks',
    department: 'Engineering Accelerator',
    location: 'Boulder, CO',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 0,
    maxExperience: 3,
    educationLevel: "Bachelor's",
    minSalary: 85000,
    maxSalary: 115000,
    description:
      'Exciting entry-level to early career opportunity to build modern full-stack web applications alongside senior mentors. Learn Next.js, PostgreSQL, and cloud deployments.',
    required: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    preferred: ['SQL', 'Next.js', 'Tailwind CSS'],
  },
];

const RAW_CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Alex Rivera',
    email: 'candidate@jobmatch.ai',
    headline: 'Senior AI & ML Engineer (LLMs & pgvector)',
    bio: 'Machine learning and backend engineer with 6+ years specializing in vector search, PyTorch embeddings, and high-concurrency Python microservices.',
    location: 'San Francisco, CA',
    yearsOfExperience: 6,
    educationLevel: "Master's",
    remotePreference: 'REMOTE',
    desiredSalary: 175000,
    skills: [
      { name: 'Python', level: 'EXPERT', years: 6 },
      { name: 'PyTorch', level: 'ADVANCED', years: 5 },
      { name: 'PostgreSQL', level: 'ADVANCED', years: 5 },
      { name: 'pgvector', level: 'ADVANCED', years: 3 },
      { name: 'LLM', level: 'ADVANCED', years: 3 },
      { name: 'Docker', level: 'INTERMEDIATE', years: 4 },
      { name: 'FastAPI', level: 'ADVANCED', years: 4 },
      { name: 'SQL', level: 'ADVANCED', years: 6 },
    ],
  },
  {
    id: 'cand-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    headline: 'Lead Full Stack & Next.js 15 Architect',
    bio: 'Passionate full-stack developer with 7 years shipping production React, Next.js App Router, and TypeScript platforms with PostgreSQL and Tailwind.',
    location: 'New York, NY',
    yearsOfExperience: 7,
    educationLevel: "Bachelor's",
    remotePreference: 'HYBRID',
    desiredSalary: 165000,
    skills: [
      { name: 'TypeScript', level: 'EXPERT', years: 6 },
      { name: 'Next.js', level: 'EXPERT', years: 5 },
      { name: 'React', level: 'EXPERT', years: 7 },
      { name: 'Node.js', level: 'ADVANCED', years: 6 },
      { name: 'PostgreSQL', level: 'ADVANCED', years: 5 },
      { name: 'Tailwind CSS', level: 'EXPERT', years: 5 },
    ],
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    headline: 'Cloud Platform & Kubernetes Specialist',
    bio: 'DevOps and infrastructure engineer focused on multi-region AWS cloud setups, automated Terraform orchestration, and resilient Kubernetes clusters.',
    location: 'Austin, TX',
    yearsOfExperience: 5,
    educationLevel: "Bachelor's",
    remotePreference: 'REMOTE',
    desiredSalary: 155000,
    skills: [
      { name: 'Kubernetes', level: 'ADVANCED', years: 5 },
      { name: 'Docker', level: 'EXPERT', years: 5 },
      { name: 'AWS', level: 'ADVANCED', years: 5 },
      { name: 'Terraform', level: 'ADVANCED', years: 4 },
      { name: 'CI/CD', level: 'ADVANCED', years: 5 },
    ],
  },
  {
    id: 'cand-4',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    headline: 'Senior Backend Engineer (Python & PostgreSQL)',
    bio: 'Backend systems engineer with 6 years experience building transactional payment APIs with PostgreSQL, Redis, and high-concurrency event pipelines.',
    location: 'Seattle, WA',
    yearsOfExperience: 6,
    educationLevel: "Master's",
    remotePreference: 'REMOTE',
    desiredSalary: 170000,
    skills: [
      { name: 'Python', level: 'EXPERT', years: 6 },
      { name: 'PostgreSQL', level: 'EXPERT', years: 6 },
      { name: 'SQL', level: 'EXPERT', years: 6 },
      { name: 'Redis', level: 'ADVANCED', years: 5 },
      { name: 'Docker', level: 'ADVANCED', years: 4 },
      { name: 'FastAPI', level: 'ADVANCED', years: 4 },
    ],
  },
];

// In-Memory Global Mock Store
class MockStore {
  skills: MockSkill[] = [];
  jobs: MockJob[] = [];
  candidates: MockCandidate[] = [];
  users: MockUser[] = [];

  constructor() {
    this.init();
  }

  init() {
    // 1. Initialize Skills
    this.skills = RAW_SKILLS.map((s, idx) => ({
      id: `skill-${idx + 1}`,
      name: s.name,
      category: s.category,
    }));

    const skillMap = new Map(this.skills.map((s) => [s.name.toLowerCase(), s]));

    // 2. Initialize Jobs
    this.jobs = RAW_JOBS.map((j) => {
      const allSkills = [...j.required, ...j.preferred];
      const embText = `${j.title} at ${j.company}. Location: ${j.location}. ${j.description} Skills: ${allSkills.join(' ')}`;
      const embedding = generateDeterministicEmbedding(embText);

      const jobSkills: MockJobSkill[] = [];
      j.required.forEach((reqName, idx) => {
        const sk = skillMap.get(reqName.toLowerCase()) || {
          id: `sk-r-${idx}`,
          name: reqName,
          category: 'OTHER',
        };
        jobSkills.push({
          id: `js-${j.id}-${idx}`,
          jobId: j.id,
          skillId: sk.id,
          skill: sk,
          isRequired: true,
        });
      });
      j.preferred.forEach((prefName, idx) => {
        const sk = skillMap.get(prefName.toLowerCase()) || {
          id: `sk-p-${idx}`,
          name: prefName,
          category: 'OTHER',
        };
        jobSkills.push({
          id: `js-${j.id}-p-${idx}`,
          jobId: j.id,
          skillId: sk.id,
          skill: sk,
          isRequired: false,
        });
      });

      return {
        id: j.id,
        title: j.title,
        company: j.company,
        department: j.department,
        location: j.location,
        type: j.type,
        remoteType: j.remoteType,
        minExperience: j.minExperience,
        maxExperience: j.maxExperience,
        educationLevel: j.educationLevel,
        minSalary: j.minSalary,
        maxSalary: j.maxSalary,
        description: j.description,
        status: 'OPEN',
        embedding,
        skills: jobSkills,
        createdAt: new Date().toISOString(),
        _count: { applications: 3 },
      };
    });

    // 3. Initialize Candidates
    this.candidates = RAW_CANDIDATES.map((c) => {
      const candSkills: MockCandidateSkill[] = c.skills.map((sk, idx) => {
        const skillObj = skillMap.get(sk.name.toLowerCase()) || {
          id: `csk-${idx}`,
          name: sk.name,
          category: 'LANGUAGE',
        };
        return {
          id: `cand-skill-${c.id}-${idx}`,
          skillId: skillObj.id,
          skill: skillObj,
          level: sk.level,
          yearsExperience: sk.years,
        };
      });

      const resumeText = `${c.name}. ${c.headline}. ${c.bio} Experience: ${c.yearsOfExperience} years. Skills: ${c.skills
        .map((s) => s.name)
        .join(', ')}`;
      const embedding = generateDeterministicEmbedding(resumeText);

      return {
        id: c.id,
        userId: `user-${c.id}`,
        user: {
          id: `user-${c.id}`,
          name: c.name,
          email: c.email,
          role: 'CANDIDATE',
        },
        headline: c.headline,
        bio: c.bio,
        location: c.location,
        yearsOfExperience: c.yearsOfExperience,
        educationLevel: c.educationLevel,
        remotePreference: c.remotePreference,
        desiredSalary: c.desiredSalary,
        skills: candSkills,
        resumes: [
          {
            id: `resume-${c.id}`,
            fileName: `${c.name.replace(/\s+/g, '_')}_Resume.pdf`,
            rawText: resumeText,
            parsedData: {
              fullName: c.name,
              email: c.email,
              headline: c.headline,
              summary: c.bio,
              totalYearsExperience: c.yearsOfExperience,
              educationLevel: c.educationLevel,
              skills: candSkills.map((cs) => ({
                name: cs.skill.name,
                category: cs.skill.category as any,
                level: cs.level as any,
                yearsExperience: cs.yearsExperience,
              })),
              experience: [
                {
                  title: c.headline.split('(')[0].trim(),
                  company: 'Apex Tech Global',
                  years: c.yearsOfExperience,
                  description: c.bio,
                  skillsUsed: candSkills.slice(0, 4).map((s) => s.skill.name),
                },
              ],
              education: [
                {
                  institution: 'State Institute of Technology',
                  degree: c.educationLevel,
                  fieldOfStudy: 'Computer Science',
                  graduationYear: '2020',
                },
              ],
              projects: [
                {
                  name: 'AI Retrieval & High-Concurrency Systems',
                  description: 'Architected vector search services and relational database optimization.',
                  skillsUsed: candSkills.slice(0, 3).map((s) => s.skill.name),
                },
              ],
              certifications: [],
            },
            embedding,
            createdAt: new Date().toISOString(),
          },
        ],
        applications: [
          {
            id: `app-${c.id}-1`,
            jobId: 'job-1',
            job: { title: 'Senior AI & LLM Systems Engineer', company: 'Nexus AI Labs' },
            status: 'INTERVIEW',
            matchScore: 89,
            createdAt: new Date().toISOString(),
          },
          {
            id: `app-${c.id}-2`,
            jobId: 'job-2',
            job: { title: 'Lead Full Stack Engineer (Next.js 15)', company: 'Hyperscale Technologies' },
            status: 'SCREENING',
            matchScore: 87,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    // 4. Initialize Demo Users
    this.users = [
      {
        id: 'usr-cand-1',
        name: 'Alex Rivera',
        email: 'candidate@jobmatch.ai',
        password: 'password123',
        role: 'CANDIDATE',
        candidateProfileId: 'cand-1',
      },
      {
        id: 'usr-rec-1',
        name: 'Sarah Jenkins',
        email: 'recruiter@jobmatch.ai',
        password: 'password123',
        role: 'RECRUITER',
        recruiterProfileId: 'rec-1',
      },
    ];
  }

  // Update candidate profile
  updateCandidate(id: string, data: Partial<MockCandidate>) {
    const candidate = this.candidates.find((c) => c.id === id) || this.candidates[0];
    Object.assign(candidate, data);
    return candidate;
  }

  // Add resume & skills to candidate
  addResume(candidateId: string, fileName: string, parsedData: ParsedResumeData, embedding: number[]) {
    const candidate = this.candidates.find((c) => c.id === candidateId) || this.candidates[0];
    candidate.headline = parsedData.headline || candidate.headline;
    candidate.bio = parsedData.summary || candidate.bio;
    candidate.yearsOfExperience = parsedData.totalYearsExperience || candidate.yearsOfExperience;
    candidate.educationLevel = parsedData.educationLevel || candidate.educationLevel;

    // Update skills
    parsedData.skills.forEach((sk, idx) => {
      const existing = candidate.skills.find(
        (s) => s.skill.name.toLowerCase() === sk.name.toLowerCase()
      );
      if (!existing) {
        candidate.skills.push({
          id: `csk-new-${Date.now()}-${idx}`,
          skillId: `sk-custom-${idx}`,
          skill: { id: `sk-custom-${idx}`, name: sk.name, category: sk.category },
          level: sk.level || 'INTERMEDIATE',
          yearsExperience: sk.yearsExperience || 2,
        });
      }
    });

    candidate.resumes.unshift({
      id: `resume-${Date.now()}`,
      fileName,
      rawText: parsedData.summary || '',
      parsedData,
      embedding,
      createdAt: new Date().toISOString(),
    });

    return candidate;
  }

  // Create job
  addJob(jobData: any) {
    const embText = `${jobData.title} at ${jobData.company}. ${jobData.description}`;
    const embedding = generateDeterministicEmbedding(embText);
    const newId = `job-${Date.now()}`;

    const jobSkills: MockJobSkill[] = [];
    (jobData.requiredSkills || []).forEach((name: string, i: number) => {
      jobSkills.push({
        id: `js-${newId}-r-${i}`,
        jobId: newId,
        skillId: `sk-${name}`,
        skill: { id: `sk-${name}`, name, category: 'OTHER' },
        isRequired: true,
      });
    });
    (jobData.preferredSkills || []).forEach((name: string, i: number) => {
      jobSkills.push({
        id: `js-${newId}-p-${i}`,
        jobId: newId,
        skillId: `sk-${name}`,
        skill: { id: `sk-${name}`, name, category: 'OTHER' },
        isRequired: false,
      });
    });

    const newJob: MockJob = {
      id: newId,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location || 'Remote',
      type: jobData.type || 'FULL_TIME',
      remoteType: jobData.remoteType || 'REMOTE',
      minExperience: jobData.minExperience || 2,
      maxExperience: jobData.maxExperience || 6,
      educationLevel: jobData.educationLevel || "Bachelor's",
      minSalary: jobData.minSalary || 100000,
      maxSalary: jobData.maxSalary || 150000,
      description: jobData.description || '',
      status: 'OPEN',
      embedding,
      skills: jobSkills,
      createdAt: new Date().toISOString(),
      _count: { applications: 0 },
    };

    this.jobs.unshift(newJob);
    return newJob;
  }

  // Add application
  addApplication(candidateId?: string, jobId?: string, coverLetter?: string, matchScore?: number) {
    const candidate = (candidateId ? this.candidates.find((c) => c.id === candidateId) : null) || this.candidates[0];
    const job = (jobId ? this.jobs.find((j) => j.id === jobId) : null) || this.jobs[0];

    // Check if already applied
    const existing = candidate.applications.find((a) => a.jobId === job.id);
    if (existing) {
      return { isExisting: true, application: existing, candidate, job };
    }

    const newApp = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      jobId: job.id,
      job: { title: job.title, company: job.company },
      status: 'APPLIED',
      matchScore: matchScore ?? 88,
      createdAt: new Date().toISOString(),
      coverLetter: coverLetter || '',
    };

    candidate.applications.unshift(newApp);
    if (!job._count) job._count = { applications: 0 };
    job._count.applications += 1;

    return { isExisting: false, application: newApp, candidate, job };
  }

  // Update application status
  updateApplication(applicationId: string, status: string) {
    for (const candidate of this.candidates) {
      const app = candidate.applications.find((a) => a.id === applicationId);
      if (app) {
        app.status = status;
        return app;
      }
    }
    return { id: applicationId, status };
  }

  // Add user account
  addUser(userData: {
    name: string;
    email: string;
    password?: string;
    role: 'CANDIDATE' | 'RECRUITER';
    companyName?: string;
  }) {
    const email = userData.email.toLowerCase().trim();
    const existing = this.users.find((u) => u.email === email);
    if (existing) {
      return { user: existing, isExisting: true };
    }

    const userId = `user-${Date.now()}`;
    let candidateProfileId: string | undefined;
    let recruiterProfileId: string | undefined;

    if (userData.role === 'CANDIDATE') {
      candidateProfileId = `cand-${Date.now()}`;
      const newCand: MockCandidate = {
        id: candidateProfileId,
        userId,
        user: {
          id: userId,
          name: userData.name,
          email,
          role: 'CANDIDATE',
        },
        headline: `${userData.name} — Software & AI Engineer`,
        bio: 'Open to high-impact software and AI engineering opportunities.',
        location: 'San Francisco, CA',
        yearsOfExperience: 3,
        educationLevel: "Bachelor's",
        remotePreference: 'REMOTE',
        desiredSalary: 135000,
        skills: [
          {
            id: `csk-user-1`,
            skillId: 'sk-Python',
            skill: { id: 'sk-Python', name: 'Python', category: 'LANGUAGE' },
            level: 'ADVANCED',
            yearsExperience: 3,
          },
          {
            id: `csk-user-2`,
            skillId: 'sk-TypeScript',
            skill: { id: 'sk-TypeScript', name: 'TypeScript', category: 'LANGUAGE' },
            level: 'INTERMEDIATE',
            yearsExperience: 2,
          },
          {
            id: `csk-user-3`,
            skillId: 'sk-React',
            skill: { id: 'sk-React', name: 'React', category: 'FRAMEWORK' },
            level: 'ADVANCED',
            yearsExperience: 3,
          },
        ],
        resumes: [],
        applications: [],
      };
      this.candidates.unshift(newCand);
    } else {
      recruiterProfileId = `rec-${Date.now()}`;
    }

    const newUser: MockUser = {
      id: userId,
      name: userData.name,
      email,
      password: userData.password,
      role: userData.role,
      candidateProfileId,
      recruiterProfileId,
    };

    this.users.unshift(newUser);
    return { user: newUser, isExisting: false };
  }

  getUserByEmail(email: string) {
    const normalized = email.toLowerCase().trim();
    return this.users.find((u) => u.email === normalized);
  }
}

// Global singleton
const globalStore = globalThis as unknown as { mockStoreInstance?: MockStore };
const existing = globalStore.mockStoreInstance;
export const mockStore =
  existing && typeof (existing as any).addUser === 'function'
    ? existing
    : new MockStore();
globalStore.mockStoreInstance = mockStore;
