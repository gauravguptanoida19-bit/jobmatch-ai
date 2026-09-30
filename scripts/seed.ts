import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateEmbedding } from '../lib/embeddings/generator';
import { calculateHybridMatch } from '../lib/matching/engine';

const prisma = new PrismaClient();

const SKILLS_LIST = [
  { name: 'Python', category: 'LANGUAGE' },
  { name: 'TypeScript', category: 'LANGUAGE' },
  { name: 'JavaScript', category: 'LANGUAGE' },
  { name: 'Go', category: 'LANGUAGE' },
  { name: 'Rust', category: 'LANGUAGE' },
  { name: 'SQL', category: 'LANGUAGE' },
  { name: 'React', category: 'FRAMEWORK' },
  { name: 'Next.js', category: 'FRAMEWORK' },
  { name: 'Node.js', category: 'FRAMEWORK' },
  { name: 'FastAPI', category: 'FRAMEWORK' },
  { name: 'Django', category: 'FRAMEWORK' },
  { name: 'Tailwind CSS', category: 'FRAMEWORK' },
  { name: 'PostgreSQL', category: 'DATABASE' },
  { name: 'pgvector', category: 'DATABASE' },
  { name: 'Redis', category: 'DATABASE' },
  { name: 'MongoDB', category: 'DATABASE' },
  { name: 'Prisma', category: 'DATABASE' },
  { name: 'Docker', category: 'CLOUD' },
  { name: 'Kubernetes', category: 'CLOUD' },
  { name: 'AWS', category: 'CLOUD' },
  { name: 'GCP', category: 'CLOUD' },
  { name: 'Terraform', category: 'CLOUD' },
  { name: 'CI/CD', category: 'CLOUD' },
  { name: 'PyTorch', category: 'AI_ML' },
  { name: 'TensorFlow', category: 'AI_ML' },
  { name: 'LLM', category: 'AI_ML' },
  { name: 'LangChain', category: 'AI_ML' },
  { name: 'OpenAI', category: 'AI_ML' },
  { name: 'NLP', category: 'AI_ML' },
  { name: 'Kafka', category: 'TOOL' },
  { name: 'GraphQL', category: 'TOOL' },
  { name: 'Git', category: 'TOOL' },
  { name: 'Linux', category: 'TOOL' },
];

const JOBS_DATA = [
  {
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
      'We are looking for a Senior AI & LLM Systems Engineer to architect low-latency vector retrieval pipelines, fine-tune open-weights models, and productionize pgvector semantic search clusters.',
    requirements:
      'Strong expertise in Python, PyTorch, pgvector, and LLM orchestration (LangChain/LlamaIndex). Experience handling high-throughput embeddings.',
    benefits: 'Full health/dental/vision, $5k learning budget, flexible PTO, 401(k) matching.',
    requiredSkills: ['Python', 'PyTorch', 'PostgreSQL', 'pgvector', 'LLM'],
    preferredSkills: ['Docker', 'Kubernetes', 'Kafka', 'LangChain'],
  },
  {
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
    requirements:
      'Extensive mastery of TypeScript, Next.js, Node.js, and Prisma ORM. Strong understanding of server-side rendering, caching, and database design.',
    benefits: 'Competitive equity grant, remote work flexibility, top-tier healthcare, annual team offsites.',
    requiredSkills: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'Node.js'],
    preferredSkills: ['Tailwind CSS', 'Prisma', 'Docker', 'AWS'],
  },
  {
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
    requirements:
      'Hands-on expertise with Docker, Kubernetes, AWS, Terraform, and CI/CD pipelines. Linux systems administration background.',
    benefits: 'Home office stipend, generous healthcare coverage, 401(k) matching, wellness allowances.',
    requiredSkills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
    preferredSkills: ['Go', 'Linux', 'Kafka', 'Python'],
  },
  {
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
    requirements:
      'Deep knowledge of Python or Go, distributed systems, ACID transactions, PostgreSQL query execution plans, and message brokers.',
    benefits: 'Top-tier tech compensation, comprehensive family health coverage, unlimited PTO.',
    requiredSkills: ['Python', 'PostgreSQL', 'SQL', 'Redis', 'Docker'],
    preferredSkills: ['Kafka', 'Go', 'AWS', 'CI/CD'],
  },
  {
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
    requirements:
      'Experience in Python, SQL, PostgreSQL, pgvector, and data streaming. Understanding of cosine distance and similarity metrics.',
    benefits: 'Stock equity options, full medical/dental, continuous education budget.',
    requiredSkills: ['Python', 'PostgreSQL', 'pgvector', 'SQL', 'Docker'],
    preferredSkills: ['PyTorch', 'Kafka', 'AWS', 'NLP'],
  },
  {
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
    requirements:
      'Deep mastery of React, TypeScript, modern CSS/Tailwind, Web Vitals optimization, and state management.',
    benefits: 'Flexible schedule, commuter transit pass, 401(k), fitness reimbursement.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript'],
    preferredSkills: ['Next.js', 'GraphQL', 'Git', 'Node.js'],
  },
  {
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
    requirements:
      'Proficiency with Next.js, TypeScript, OpenAI APIs, LangChain, and vector embeddings.',
    benefits: 'Health, Vision, Dental, equity package, flexible remote days.',
    requiredSkills: ['Next.js', 'TypeScript', 'OpenAI', 'LangChain', 'React'],
    preferredSkills: ['Python', 'PostgreSQL', 'Tailwind CSS'],
  },
  {
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
    requirements:
      'Foundational understanding of JavaScript/TypeScript, React, Node.js, and SQL basics. High curiosity and willingness to learn.',
    benefits: 'Mentorship program, comprehensive healthcare, $3k learning stipend.',
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    preferredSkills: ['SQL', 'Next.js', 'Git', 'Tailwind CSS'],
  },
  {
    title: 'Senior DevOps & SRE Engineer',
    company: 'CloudReliable Inc.',
    department: 'Infrastructure Operations',
    location: 'Chicago, IL',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 5,
    maxExperience: 9,
    educationLevel: "Bachelor's",
    minSalary: 150000,
    maxSalary: 195000,
    description:
      'Champion uptime, latency SLA guarantees, zero-downtime rolling upgrades, and infrastructure hardening across AWS and Kubernetes environments.',
    requirements:
      'Extensive background with Kubernetes, AWS, Terraform, CI/CD pipelines, Docker, and Linux incident troubleshooting.',
    benefits: 'Competitive base + equity, annual wellness stipend, 100% remote team.',
    requiredSkills: ['Kubernetes', 'AWS', 'Terraform', 'Docker', 'Linux'],
    preferredSkills: ['Go', 'Python', 'CI/CD'],
  },
  {
    title: 'Principal Distributed Systems Architect',
    company: 'Vertex Data Core',
    department: 'Infrastructure Architecture',
    location: 'Boston, MA',
    remoteType: 'HYBRID',
    type: 'FULL_TIME',
    minExperience: 8,
    maxExperience: 14,
    educationLevel: "Master's",
    minSalary: 190000,
    maxSalary: 260000,
    description:
      'Lead architectural vision for real-time distributed consensus, message log streaming with Kafka, and large-scale data partitioning.',
    requirements:
      'Proven track record designing large-scale distributed architectures. Deep expertise in Go/Rust, Kafka, PostgreSQL, and network protocols.',
    benefits: 'Generous executive equity, executive healthcare plan, full relocation assistance.',
    requiredSkills: ['Go', 'Kafka', 'PostgreSQL', 'Docker', 'Kubernetes'],
    preferredSkills: ['Rust', 'Python', 'AWS', 'Linux'],
  },
  {
    title: 'Senior PostgreSQL Database Engineer',
    company: 'Supadata Platform',
    department: 'Data Platform',
    location: 'Remote',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 6,
    maxExperience: 10,
    educationLevel: "Bachelor's",
    minSalary: 165000,
    maxSalary: 210000,
    description:
      'Optimize query planners, extension internals (including pgvector), write-ahead logging (WAL), replication lag, and partition scaling for high-concurrency PostgreSQL instances.',
    requirements:
      'Deep PostgreSQL internals experience, index tuning (B-Tree, GIN, HNSW), connection pooling, and schema migration strategies.',
    benefits: '401(k) matching, health insurance, annual retreat in Europe, home office allowance.',
    requiredSkills: ['PostgreSQL', 'SQL', 'pgvector', 'Linux'],
    preferredSkills: ['Python', 'Docker', 'Go', 'AWS'],
  },
  {
    title: 'Full Stack AI Engineer',
    company: 'Synthetix Dynamics',
    department: 'Product Systems',
    location: 'Seattle, WA',
    remoteType: 'HYBRID',
    type: 'FULL_TIME',
    minExperience: 3,
    maxExperience: 6,
    educationLevel: "Bachelor's",
    minSalary: 135000,
    maxSalary: 180000,
    description:
      'Build end-to-end full-stack applications with Next.js, TypeScript, PostgreSQL, and OpenAI LLM embeddings to power customer-facing generative workflows.',
    requirements:
      'Solid full-stack development skills with TypeScript, React, Next.js, Node.js, and practical AI API integration experience.',
    benefits: 'Comprehensive health benefits, stock grants, flexible work hours.',
    requiredSkills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL'],
    preferredSkills: ['OpenAI', 'Python', 'Tailwind CSS', 'Docker'],
  },
];

const CANDIDATES_DATA = [
  {
    name: 'Alex Rivera',
    email: 'candidate@jobmatch.ai',
    headline: 'Senior AI / ML Engineer (LLMs & pgvector)',
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
      { name: 'Prisma', level: 'ADVANCED', years: 4 },
      { name: 'Tailwind CSS', level: 'EXPERT', years: 5 },
    ],
  },
  {
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
      { name: 'Linux', level: 'ADVANCED', years: 5 },
      { name: 'Python', level: 'INTERMEDIATE', years: 3 },
    ],
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    headline: 'Senior Backend Engineer (Python & Distributed DBs)',
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
      { name: 'Kafka', level: 'INTERMEDIATE', years: 3 },
    ],
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    headline: 'Senior Frontend Engineer & Design Systems Architect',
    bio: 'Frontend engineer with 5 years crafting accessible UI libraries, high-performance dashboards, and responsive web apps using React and TypeScript.',
    location: 'San Francisco, CA',
    yearsOfExperience: 5,
    educationLevel: "Bachelor's",
    remotePreference: 'HYBRID',
    desiredSalary: 150000,
    skills: [
      { name: 'React', level: 'EXPERT', years: 5 },
      { name: 'TypeScript', level: 'ADVANCED', years: 4 },
      { name: 'JavaScript', level: 'EXPERT', years: 5 },
      { name: 'Tailwind CSS', level: 'EXPERT', years: 4 },
      { name: 'Next.js', level: 'ADVANCED', years: 3 },
      { name: 'GraphQL', level: 'INTERMEDIATE', years: 3 },
    ],
  },
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    headline: 'AI Product & Vector Search Engineer',
    bio: 'Applied AI engineer specializing in LangChain multi-agent systems, Next.js interfaces, OpenAI embedding pipelines, and PostgreSQL pgvector.',
    location: 'San Francisco, CA',
    yearsOfExperience: 4,
    educationLevel: "Bachelor's",
    remotePreference: 'HYBRID',
    desiredSalary: 145000,
    skills: [
      { name: 'Next.js', level: 'ADVANCED', years: 4 },
      { name: 'TypeScript', level: 'ADVANCED', years: 4 },
      { name: 'OpenAI', level: 'ADVANCED', years: 3 },
      { name: 'LangChain', level: 'ADVANCED', years: 3 },
      { name: 'React', level: 'ADVANCED', years: 4 },
      { name: 'PostgreSQL', level: 'INTERMEDIATE', years: 3 },
      { name: 'pgvector', level: 'INTERMEDIATE', years: 2 },
    ],
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@example.com',
    headline: 'Associate Full Stack Developer',
    bio: 'Recent CS graduate with 1.5 years internship and contract experience building full-stack applications with React, TypeScript, Node.js, and SQL.',
    location: 'Boulder, CO',
    yearsOfExperience: 1.5,
    educationLevel: "Bachelor's",
    remotePreference: 'REMOTE',
    desiredSalary: 92000,
    skills: [
      { name: 'JavaScript', level: 'ADVANCED', years: 2 },
      { name: 'TypeScript', level: 'INTERMEDIATE', years: 1.5 },
      { name: 'React', level: 'ADVANCED', years: 2 },
      { name: 'Node.js', level: 'INTERMEDIATE', years: 1.5 },
      { name: 'SQL', level: 'INTERMEDIATE', years: 1.5 },
      { name: 'Git', level: 'INTERMEDIATE', years: 2 },
    ],
  },
  {
    name: 'Carlos Mendez',
    email: 'carlos.mendez@example.com',
    headline: 'Machine Learning Infrastructure & SRE',
    bio: 'Infrastructure and ML engineer with 6 years experience deploying PyTorch distributed training jobs on AWS GPU clusters and managing Kubernetes.',
    location: 'Denver, CO',
    yearsOfExperience: 6,
    educationLevel: "Master's",
    remotePreference: 'REMOTE',
    desiredSalary: 168000,
    skills: [
      { name: 'Python', level: 'ADVANCED', years: 6 },
      { name: 'Kubernetes', level: 'ADVANCED', years: 5 },
      { name: 'AWS', level: 'ADVANCED', years: 5 },
      { name: 'Docker', level: 'EXPERT', years: 6 },
      { name: 'PyTorch', level: 'INTERMEDIATE', years: 3 },
      { name: 'CI/CD', level: 'ADVANCED', years: 4 },
    ],
  },
  {
    name: 'Maya Patel',
    email: 'maya.patel@example.com',
    headline: 'Principal Distributed Database Engineer',
    bio: 'Senior systems engineer with 9 years specializing in PostgreSQL internals, pgvector query optimization, Kafka real-time streaming, and Go.',
    location: 'Boston, MA',
    yearsOfExperience: 9,
    educationLevel: "Master's",
    remotePreference: 'HYBRID',
    desiredSalary: 210000,
    skills: [
      { name: 'PostgreSQL', level: 'EXPERT', years: 9 },
      { name: 'Go', level: 'EXPERT', years: 7 },
      { name: 'SQL', level: 'EXPERT', years: 9 },
      { name: 'Kafka', level: 'ADVANCED', years: 6 },
      { name: 'pgvector', level: 'ADVANCED', years: 3 },
      { name: 'Docker', level: 'ADVANCED', years: 6 },
      { name: 'Linux', level: 'EXPERT', years: 8 },
    ],
  },
  {
    name: 'James O Connor',
    email: 'james.oconnor@example.com',
    headline: 'Senior Site Reliability & Platform Engineer',
    bio: 'SRE with 7 years managing mission-critical infrastructure, Terraform cloud automation, Docker, and zero-downtime microservices on AWS.',
    location: 'Chicago, IL',
    yearsOfExperience: 7,
    educationLevel: "Bachelor's",
    remotePreference: 'REMOTE',
    desiredSalary: 160000,
    skills: [
      { name: 'Kubernetes', level: 'EXPERT', years: 6 },
      { name: 'AWS', level: 'EXPERT', years: 7 },
      { name: 'Terraform', level: 'ADVANCED', years: 5 },
      { name: 'Docker', level: 'EXPERT', years: 7 },
      { name: 'Linux', level: 'EXPERT', years: 7 },
      { name: 'CI/CD', level: 'ADVANCED', years: 6 },
    ],
  },
  {
    name: 'Liam Tanaka',
    email: 'liam.tanaka@example.com',
    headline: 'Full Stack AI & Web Developer',
    bio: '4 years of experience shipping Next.js full-stack web applications, integrating OpenAI GPT-4 APIs, and designing PostgreSQL database schemas.',
    location: 'Seattle, WA',
    yearsOfExperience: 4,
    educationLevel: "Bachelor's",
    remotePreference: 'HYBRID',
    desiredSalary: 140000,
    skills: [
      { name: 'TypeScript', level: 'ADVANCED', years: 4 },
      { name: 'Next.js', level: 'ADVANCED', years: 4 },
      { name: 'React', level: 'ADVANCED', years: 4 },
      { name: 'Node.js', level: 'ADVANCED', years: 4 },
      { name: 'PostgreSQL', level: 'INTERMEDIATE', years: 3 },
      { name: 'OpenAI', level: 'INTERMEDIATE', years: 2 },
    ],
  },
  {
    name: 'Chloe Dubois',
    email: 'chloe.dubois@example.com',
    headline: 'NLP & Semantic Retrieval Specialist',
    bio: 'Data scientist and engineer with 5 years focused on NLP embeddings, semantic search retrieval, Python PyTorch pipelines, and pgvector.',
    location: 'San Jose, CA',
    yearsOfExperience: 5,
    educationLevel: "PhD",
    remotePreference: 'REMOTE',
    desiredSalary: 160000,
    skills: [
      { name: 'Python', level: 'EXPERT', years: 5 },
      { name: 'NLP', level: 'EXPERT', years: 5 },
      { name: 'PyTorch', level: 'ADVANCED', years: 4 },
      { name: 'PostgreSQL', level: 'ADVANCED', years: 4 },
      { name: 'pgvector', level: 'ADVANCED', years: 3 },
      { name: 'SQL', level: 'ADVANCED', years: 4 },
    ],
  },
  {
    name: 'Noah Washington',
    email: 'noah.washington@example.com',
    headline: 'DevOps & Automation Engineer',
    bio: '3.5 years managing automated CI/CD deployment pipelines, containerizing Node/Python microservices with Docker, and provisioning cloud servers.',
    location: 'Austin, TX',
    yearsOfExperience: 3.5,
    educationLevel: "Bachelor's",
    remotePreference: 'HYBRID',
    desiredSalary: 125000,
    skills: [
      { name: 'Docker', level: 'ADVANCED', years: 3.5 },
      { name: 'CI/CD', level: 'ADVANCED', years: 3.5 },
      { name: 'Linux', level: 'ADVANCED', years: 3.5 },
      { name: 'AWS', level: 'INTERMEDIATE', years: 3 },
      { name: 'Python', level: 'INTERMEDIATE', years: 2.5 },
    ],
  },
  {
    name: 'Sophia Rossi',
    email: 'sophia.rossi@example.com',
    headline: 'Senior React & Next.js UI Specialist',
    bio: 'Front-end engineer with 6 years experience building performant web apps, interactive canvas tools, and clean Tailwind design systems in React.',
    location: 'Los Angeles, CA',
    yearsOfExperience: 6,
    educationLevel: "Bachelor's",
    remotePreference: 'REMOTE',
    desiredSalary: 150000,
    skills: [
      { name: 'React', level: 'EXPERT', years: 6 },
      { name: 'TypeScript', level: 'ADVANCED', years: 5 },
      { name: 'Next.js', level: 'ADVANCED', years: 4 },
      { name: 'Tailwind CSS', level: 'EXPERT', years: 4 },
      { name: 'JavaScript', level: 'EXPERT', years: 6 },
    ],
  },
  {
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@example.com',
    headline: 'Python Backend & Microservices Engineer',
    bio: 'Backend engineer with 4.5 years developing asynchronous FastAPI services, modeling PostgreSQL schemas, and configuring Redis caches.',
    location: 'Miami, FL',
    yearsOfExperience: 4.5,
    educationLevel: "Bachelor's",
    remotePreference: 'REMOTE',
    desiredSalary: 135000,
    skills: [
      { name: 'Python', level: 'ADVANCED', years: 4.5 },
      { name: 'FastAPI', level: 'ADVANCED', years: 4 },
      { name: 'PostgreSQL', level: 'ADVANCED', years: 4 },
      { name: 'Redis', level: 'INTERMEDIATE', years: 3 },
      { name: 'SQL', level: 'ADVANCED', years: 4 },
      { name: 'Docker', level: 'INTERMEDIATE', years: 3 },
    ],
  },
  {
    name: 'Ethan Wright',
    email: 'ethan.wright@example.com',
    headline: 'Cloud Infrastructure & Database Architect',
    bio: '8 years engineering resilient cloud platforms, optimizing distributed PostgreSQL databases, and orchestrating container workloads.',
    location: 'San Francisco, CA',
    yearsOfExperience: 8,
    educationLevel: "Master's",
    remotePreference: 'REMOTE',
    desiredSalary: 185000,
    skills: [
      { name: 'AWS', level: 'EXPERT', years: 8 },
      { name: 'PostgreSQL', level: 'EXPERT', years: 8 },
      { name: 'Kubernetes', level: 'ADVANCED', years: 6 },
      { name: 'Terraform', level: 'ADVANCED', years: 5 },
      { name: 'Docker', level: 'EXPERT', years: 7 },
      { name: 'SQL', level: 'EXPERT', years: 8 },
    ],
  },
];

async function main() {
  console.log('--- Starting JobMatch AI Database Seed ---');

  // 1. Seed Skills
  console.log('Seeding skills taxonomy...');
  const skillMap = new Map<string, string>();
  for (const sk of SKILLS_LIST) {
    const record = await prisma.skill.upsert({
      where: { name: sk.name },
      update: { category: sk.category },
      create: { name: sk.name, category: sk.category },
    });
    skillMap.set(sk.name.toLowerCase(), record.id);
  }
  console.log(`✓ Seeded ${SKILLS_LIST.length} skills`);

  // 2. Seed Recruiter Account & Profile
  console.log('Seeding recruiter account...');
  const defaultPassword = await bcrypt.hash('password123', 10);

  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recruiter@jobmatch.ai' },
    update: {},
    create: {
      email: 'recruiter@jobmatch.ai',
      name: 'Elena Rostova',
      password: defaultPassword,
      role: 'RECRUITER',
      recruiterProfile: {
        create: {
          companyName: 'Apex Talent Intelligence',
          companyWebsite: 'https://apextalent.example.com',
          department: 'Technical Talent Acquisition',
        },
      },
    },
    include: { recruiterProfile: true },
  });

  const recruiterProfileId = recruiterUser.recruiterProfile!.id;
  console.log(`✓ Recruiter profile ready: ${recruiterUser.email}`);

  // 3. Seed Jobs
  console.log(`Seeding ${JOBS_DATA.length} realistic tech jobs...`);
  const createdJobs = [];
  for (const j of JOBS_DATA) {
    const allSkillsStr = [...j.requiredSkills, ...j.preferredSkills].join(', ');
    const embText = `${j.title} at ${j.company}. Location: ${j.location}. ${j.description} Required: ${allSkillsStr}`;
    const embedding = await generateEmbedding(embText);

    // Check if job already exists
    const existing = await prisma.job.findFirst({
      where: { title: j.title, company: j.company },
    });

    let jobRecord = existing;
    if (!existing) {
      jobRecord = await prisma.job.create({
        data: {
          recruiterProfileId,
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
          requirements: j.requirements,
          benefits: j.benefits,
          status: 'OPEN',
        },
      });

      // Link required skills
      for (const reqSkill of j.requiredSkills) {
        const skillId = skillMap.get(reqSkill.toLowerCase());
        if (skillId) {
          await prisma.jobSkill.create({
            data: {
              jobId: jobRecord.id,
              skillId,
              isRequired: true,
            },
          });
        }
      }

      // Link preferred skills
      for (const prefSkill of j.preferredSkills) {
        const skillId = skillMap.get(prefSkill.toLowerCase());
        if (skillId && !j.requiredSkills.includes(prefSkill)) {
          await prisma.jobSkill.create({
            data: {
              jobId: jobRecord.id,
              skillId,
              isRequired: false,
            },
          });
        }
      }

      // Raw pgvector update if supported
      try {
        const vectorStr = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "Job" SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          jobRecord.id
        );
      } catch (e) {
        // Fallback for non-pgvector local dev
      }
    }

    createdJobs.push(jobRecord!);
  }
  console.log(`✓ Seeded ${createdJobs.length} jobs with vector embeddings`);

  // 4. Seed 16+ Candidates
  console.log(`Seeding ${CANDIDATES_DATA.length} candidate profiles...`);
  const createdCandidates = [];

  for (const c of CANDIDATES_DATA) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        password: defaultPassword,
        role: 'CANDIDATE',
        candidateProfile: {
          create: {
            headline: c.headline,
            bio: c.bio,
            location: c.location,
            yearsOfExperience: c.yearsOfExperience,
            educationLevel: c.educationLevel,
            remotePreference: c.remotePreference,
            desiredSalary: c.desiredSalary,
          },
        },
      },
      include: { candidateProfile: true },
    });

    const candidateProfile = user.candidateProfile!;

    // Link skills
    for (const sk of c.skills) {
      const skillId = skillMap.get(sk.name.toLowerCase());
      if (skillId) {
        await prisma.candidateSkill.upsert({
          where: {
            candidateProfileId_skillId: {
              candidateProfileId: candidateProfile.id,
              skillId,
            },
          },
          update: { level: sk.level, yearsExperience: sk.years },
          create: {
            candidateProfileId: candidateProfile.id,
            skillId,
            level: sk.level,
            yearsExperience: sk.years,
          },
        });
      }
    }

    // Create synthetic Resume record & embedding
    const resumeText = `${c.name}. ${c.headline}. Experience: ${c.yearsOfExperience} years. Skills: ${c.skills
      .map((s) => s.name)
      .join(', ')}. Bio: ${c.bio}`;
    const embedding = await generateEmbedding(resumeText);

    const existingResume = await prisma.resume.findFirst({
      where: { candidateProfileId: candidateProfile.id },
    });

    if (!existingResume) {
      const resume = await prisma.resume.create({
        data: {
          candidateProfileId: candidateProfile.id,
          fileName: `${c.name.replace(/\s+/g, '_')}_Resume.pdf`,
          rawText: resumeText,
          parsedData: {
            fullName: c.name,
            email: c.email,
            headline: c.headline,
            summary: c.bio,
            totalYearsExperience: c.yearsOfExperience,
            educationLevel: c.educationLevel,
            skills: c.skills.map((s) => ({
              name: s.name,
              category: 'LANGUAGE',
              level: s.level,
              yearsExperience: s.years,
            })),
            experience: [
              {
                title: c.headline.split('(')[0].trim(),
                company: 'Tech Enterprises Global',
                years: c.yearsOfExperience,
                description: c.bio,
                skillsUsed: c.skills.slice(0, 4).map((s) => s.name),
              },
            ],
            education: [
              {
                institution: 'State Institute of Technology',
                degree: c.educationLevel,
                fieldOfStudy: 'Computer Science & Engineering',
                graduationYear: '2020',
              },
            ],
            projects: [
              {
                name: 'High-Performance Scalable Cloud Platform',
                description: 'Engineered backend microservices and vector retrieval architecture.',
                skillsUsed: c.skills.slice(0, 3).map((s) => s.name),
              },
            ],
            certifications: [],
          },
        },
      });

      try {
        const vectorStr = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "Resume" SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          resume.id
        );
      } catch (e) {
        // Fallback for non-pgvector local dev
      }
    }

    createdCandidates.push({
      ...candidateProfile,
      user,
      skills: c.skills,
    });
  }
  console.log(`✓ Seeded ${createdCandidates.length} candidate profiles with parsed resumes`);

  // 5. Seed Applications & Hybrid Match Scores
  console.log('Seeding applications and calculating multi-criteria hybrid match scores...');
  const statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];
  let appCount = 0;

  for (let i = 0; i < createdJobs.length; i++) {
    const job = createdJobs[i];
    const jobData = JOBS_DATA[i];

    // Pick 2-4 candidates for each job to create realistic applicant rosters
    const candidateSubset = createdCandidates.slice(i % 5, (i % 5) + 3);

    for (let cIdx = 0; cIdx < candidateSubset.length; cIdx++) {
      const candidate = candidateSubset[cIdx];

      // Calculate hybrid match
      const match = await calculateHybridMatch(
        {
          name: candidate.user.name,
          skills: candidate.skills,
          yearsOfExperience: candidate.yearsOfExperience,
          educationLevel: candidate.educationLevel || "Bachelor's",
          location: candidate.location || undefined,
          remotePreference: candidate.remotePreference,
          desiredSalary: candidate.desiredSalary || undefined,
        },
        {
          title: job.title,
          requiredSkills: jobData.requiredSkills,
          preferredSkills: jobData.preferredSkills,
          minExperience: job.minExperience,
          maxExperience: job.maxExperience,
          educationLevel: job.educationLevel,
          location: job.location,
          remoteType: job.remoteType,
          minSalary: job.minSalary,
          maxSalary: job.maxSalary,
        }
      );

      const status = statuses[(i + cIdx) % statuses.length];

      await prisma.application.upsert({
        where: {
          jobId_candidateProfileId: {
            jobId: job.id,
            candidateProfileId: candidate.id,
          },
        },
        update: {
          matchScore: match.overallScore,
          status,
        },
        create: {
          jobId: job.id,
          candidateProfileId: candidate.id,
          coverLetter: `Hello Hiring Team at ${job.company}, I am excited about the ${job.title} role. My technical background in ${candidate.skills.slice(0, 3).map((s: any) => s.name).join(', ')} aligns well with your team vision.`,
          matchScore: match.overallScore,
          status,
        },
      });

      await prisma.matchResult.upsert({
        where: {
          jobId_candidateProfileId: {
            jobId: job.id,
            candidateProfileId: candidate.id,
          },
        },
        update: {
          overallScore: match.overallScore,
          skillScore: match.breakdown.skillsMatch,
          semanticScore: match.breakdown.semanticMatch,
          experienceScore: match.breakdown.experienceMatch,
          educationScore: match.breakdown.educationMatch,
          preferenceScore: match.breakdown.preferencesMatch,
          matchingSkills: match.matchingSkills,
          missingSkills: match.missingSkills,
          reasoning: {
            strengths: match.strengths,
            summary: match.summary,
          },
          recommendations: match.recommendations.join('; '),
        },
        create: {
          jobId: job.id,
          candidateProfileId: candidate.id,
          overallScore: match.overallScore,
          skillScore: match.breakdown.skillsMatch,
          semanticScore: match.breakdown.semanticMatch,
          experienceScore: match.breakdown.experienceMatch,
          educationScore: match.breakdown.educationMatch,
          preferenceScore: match.breakdown.preferencesMatch,
          matchingSkills: match.matchingSkills,
          missingSkills: match.missingSkills,
          reasoning: {
            strengths: match.strengths,
            summary: match.summary,
          },
          recommendations: match.recommendations.join('; '),
        },
      });

      appCount++;
    }
  }

  console.log(`✓ Seeded ${appCount} applications with explainable match breakdowns`);
  console.log('--- JobMatch AI Seed Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
