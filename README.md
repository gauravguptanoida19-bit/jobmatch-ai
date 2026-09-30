# JobMatch AI — AI-Powered Job Matching & Candidate Intelligence Platform

**JobMatch AI** is a production-grade recruitment technology and talent intelligence platform engineered with Next.js 15, PostgreSQL, pgvector, and OpenAI-compatible LLMs. It addresses the fundamental flaw of legacy keyword-matching Applicant Tracking Systems (ATS) by pairing high-dimensional semantic vector search with a transparent, 5-factor hybrid scoring algorithm.

---

## 📌 Architecture Overview

```mermaid
graph TD
    subgraph Client ["Frontend (Next.js 15 App Router + Tailwind CSS + Lucide)"]
        Landing["Landing & Demo Explorer (/page.tsx)"]
        CandidateDash["Candidate Portal & Resume Analyzer (/dashboard/candidate)"]
        RecruiterDash["Recruiter Suite & Applicant Ranking (/dashboard/recruiter)"]
        AnalyticsView["Recruiter Analytics & Market Gap (Recharts)"]
        JobSearch["Natural-Language Vector Search (/jobs/search)"]
    end

    subgraph API ["Next.js Server Layer (API Routes & Server Actions)"]
        AuthMiddleware["Auth.js v5 (JWT & Role Guards)"]
        ResumeUploadAPI["/api/resumes/upload (pdf-parse)"]
        MatchingAPI["/api/jobs/[id]/applicants (Hybrid Scoring Engine)"]
        SemanticSearchAPI["/api/search (pgvector Cosine Retrieval)"]
        AnalyticsAPI["/api/analytics (Pipeline Metrics & Funnel)"]
    end

    subgraph AI ["AI & Vector Layer"]
        LLM["OpenAI LLM (Structured JSON Extraction & Reasoning)"]
        Embedder["OpenAI Embeddings (text-embedding-3-small, 1536 dims)"]
        FallbackEngine["High-Fidelity Deterministic Vector Synthesizer"]
    end

    subgraph Data ["Database Layer"]
        Postgres[("PostgreSQL 16 + pgvector Extension")]
        PrismaORM["Prisma ORM Client & Raw Vector Operators"]
    end

    Client --> API
    API --> AuthMiddleware
    API --> AI
    API --> Data
    Data --> Postgres
    PrismaORM --> Postgres
```

---

## 🚀 Core Features

### 1. 5-Factor Hybrid Matching Engine
Unlike simplistic keyword counters or opaque prompt wrappers, JobMatch AI uses an audited multi-criteria mathematical formula:
$$\text{Final Score} = 0.35 \cdot S_{\text{skills}} + 0.25 \cdot S_{\text{semantic}} + 0.20 \cdot S_{\text{experience}} + 0.10 \cdot S_{\text{education}} + 0.10 \cdot S_{\text{preferences}}$$

- **Skills Match (35%)**: Evaluates overlap against required skills (severe penalty if missing essential requirements) and preferred skills (additive bonus), boosted by verified years of experience.
- **Semantic Similarity (25%)**: Cosine similarity calculated directly via `pgvector` ($1 - (\vec{u} \Leftrightarrow \vec{v})$) between the candidate's resume/profile embedding and the job description embedding.
- **Experience Match (20%)**: Compares total career tenure against target requisition min/max boundaries.
- **Education Match (10%)**: Degree hierarchy ranking (PhD $\rightarrow$ Master's $\rightarrow$ Bachelor's $\rightarrow$ Associate's $\rightarrow$ Bootcamp/Self-taught).
- **Preference/Location Match (10%)**: Remote policy alignment (Remote/Hybrid/Onsite), location proximity, and compensation expectations.

### 2. Transparent & Explainable Match Insights
Every candidate fit calculation generates human-readable diagnostics:
- **Exact Percentage Sub-scores**: Skills, Semantic, Experience, Education, Preferences.
- **Why This Candidate Matches**: Concise, bulleted technical strengths.
- **Missing Skills**: Explicit gap indicators (e.g., `Kafka`, `Kubernetes`, `AWS`).
- **Actionable Recommendations**: Specific coaching and project suggestions for candidate upskilling.

### 3. Automated PDF Resume Processing Pipeline
Candidates can drag-and-drop PDF resumes:
1. Binary PDF text extraction via `pdf-parse`.
2. Structured JSON entity extraction with LLM (extracting candidate contact, education, experiences, skills with categories and levels, projects, and work preferences).
3. 1536-dimensional vector embedding generation.
4. Synchronous database indexing with PostgreSQL and `pgvector`.

### 4. Natural-Language Semantic Job & Candidate Search
- **Job Search**: Candidates search by intent (e.g., *"Find backend jobs using Python and PostgreSQL"*, *"Show jobs requiring Next.js and vector databases"*).
- **Candidate Search**: Recruiters query talent using natural language (e.g., *"Find candidates with React, Node.js and AI experience"*).
- **Vector Operator**: Uses the native PostgreSQL `<=>` cosine distance operator for near-instant nearest-neighbor ranking.

### 5. Recruiter ATS & Pipeline Analytics
- Complete requisition lifecycle: Create, Edit, Delete positions.
- Ranked applicant pipeline sorted by overall AI match score.
- Dynamic status progression: `APPLIED` $\rightarrow$ `SCREENING` $\rightarrow$ `INTERVIEW` $\rightarrow$ `OFFER` $\rightarrow$ `REJECTED`.
- Interactive Recharts visualizations:
  - Match Score Distribution (histogram).
  - Hiring Pipeline Funnel (conversion stage counts).
  - Market Skill Gaps (Requisition Demand vs Candidate Supply).

---

## 🛠 Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | Server and client rendering, routing, layouts |
| **Styling & UI** | Tailwind CSS, Lucide React, CVA | Modern, responsive dark/light SaaS aesthetics |
| **Charts** | Recharts | Recruitment analytics and funnel visualizations |
| **Database** | PostgreSQL 16 + pgvector | Relational schema and 1536-dim vector indexing |
| **ORM** | Prisma ORM | Type-safe queries and raw vector operators |
| **Embeddings** | OpenAI `text-embedding-3-small` (1536-dim) | High-dimensional text representation + fallback |
| **LLM** | OpenAI `gpt-4o-mini` | Structured JSON extraction & explainability |
| **PDF Extraction** | `pdf-parse` | Server-side resume parsing |
| **Authentication** | Auth.js (NextAuth v5 beta), bcryptjs | Secure JWT session management, RBAC |
| **Validation** | Zod | Strict schema validation for API inputs |
| **DevOps** | Docker, Docker Compose | Multi-stage production containerization |

---

## 🗄 Database Schema Design

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

enum Role {
  CANDIDATE
  RECRUITER
  ADMIN
}

model User {
  id               String            @id @default(cuid())
  email            String            @unique
  password         String
  name             String
  role             Role              @default(CANDIDATE)
  candidateProfile CandidateProfile?
  recruiterProfile RecruiterProfile?
}

model CandidateProfile {
  id                String           @id @default(cuid())
  userId            String           @unique
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  headline          String?
  bio               String?          @db.Text
  location          String?
  yearsOfExperience Float            @default(0)
  educationLevel    String?          @default("Bachelor's")
  remotePreference  String           @default("HYBRID")
  skills            CandidateSkill[]
  resumes           Resume[]
  applications      Application[]
  matches           MatchResult[]
}

model Job {
  id                 String                       @id @default(cuid())
  recruiterProfileId String
  title              String
  company            String
  location           String
  remoteType         String                       @default("HYBRID")
  minExperience      Int                          @default(0)
  maxExperience      Int                          @default(10)
  minSalary          Int                          @default(80000)
  maxSalary          Int                          @default(150000)
  description        String                       @db.Text
  status             String                       @default("OPEN")
  embedding          Unsupported("vector(1536)")?
  skills             JobSkill[]
  applications       Application[]
  matches            MatchResult[]
}

model MatchResult {
  id                 String           @id @default(cuid())
  jobId              String
  candidateProfileId String
  overallScore       Float
  skillScore         Float
  semanticScore      Float
  experienceScore    Float
  educationScore     Float
  preferenceScore    Float
  matchingSkills     Json
  missingSkills      Json
  reasoning          Json
  recommendations    String           @db.Text
  @@unique([jobId, candidateProfileId])
}
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/jobmatch_db?schema=public` |
| `AUTH_SECRET` | NextAuth JWT signing secret | Random 32+ character string |
| `NEXTAUTH_URL` | Application root URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL | `http://localhost:3000` |
| `OPENAI_API_KEY` | *(Optional)* OpenAI key for live LLM inference | If blank, uses high-fidelity local deterministic synthesizer |
| `OPENAI_MODEL` | Chat completion model | `gpt-4o-mini` |
| `EMBEDDING_MODEL` | Vector embedding model | `text-embedding-3-small` |

> [!NOTE]
> **Zero API Dependency Guarantee**: If `OPENAI_API_KEY` is not set, the platform automatically engages its built-in high-fidelity vector synthesizer and deterministic entity extractor, ensuring that all match scores, explainable cards, and semantic searches function end-to-end out of the box with zero runtime errors.

---

## 🏃 Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Test Suite
Verify vector calculations, L2 norm properties, and hybrid scoring logic:
```bash
npm run test:engine
```

### 4. Push Database Schema & Seed Data
Ensure your PostgreSQL instance with `pgvector` is running, then:
```bash
npx prisma db push
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Setup

The platform includes a containerized multi-stage Docker environment with `pgvector`:

```bash
docker compose up --build
```

This spins up:
- **`jobmatch-ai-postgres`**: PostgreSQL 16 with the official `pgvector` extension enabled.
- **`jobmatch-ai-app`**: Production Next.js 15 server running on port `3000`.

---

## 🔑 Pre-Configured Demo Accounts

For immediate evaluation, the seed script provides ready-to-use accounts:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Recruiter** | `recruiter@jobmatch.ai` | `password123` | ATS Suite, Requisition Creation, Applicant Ranking, Analytics |
| **Candidate** | `candidate@jobmatch.ai` | `password123` | Resume Upload, Profile Inspector, Recommended Jobs, Match Breakdown |

---

## 📡 REST API Documentation

### 1. Resumes
- **`POST /api/resumes/upload`**: Accepts `multipart/form-data` with PDF file. Extracts text, structures entities, generates embedding, and updates candidate profile.

### 2. Jobs
- **`GET /api/jobs`**: List positions with optional query filters (`search`, `remoteType`, `minSalary`, `location`).
- **`POST /api/jobs`**: Create a new position with required and preferred skills; generates vector embedding.
- **`GET /api/jobs/[id]`**: Retrieve single job details.
- **`PUT /api/jobs/[id]`**: Update position.
- **`DELETE /api/jobs/[id]`**: Delete position.

### 3. AI Matching & Ranking
- **`GET /api/jobs/[id]/applicants`**: Returns all applicants for a position ranked by overall hybrid match score descending, with complete 5-criteria breakdown.
- **`GET /api/jobs/[id]/match/[candidateId]`**: Calculates real-time explainability and fit score between a specific job and candidate.

### 4. Semantic Search
- **`GET /api/search/jobs?q=...`**: Natural-language query search over open jobs using pgvector cosine distance.
- **`GET /api/search/candidates?q=...`**: Recruiter semantic talent search over candidate embeddings.

### 5. Candidate Recommendations
- **`GET /api/candidates/recommendations`**: Returns top-matching jobs tailored to the authenticated candidate.

### 6. Pipeline Analytics
- **`GET /api/analytics`**: Aggregate hiring metrics, match score distribution, application funnel, and skill gap supply/demand.

---

## 🔮 Future Improvements

1. **Multi-Agent Interview Copilot**: Automated candidate pre-screening with conversational agent memory.
2. **Dynamic Weight Tuning per Requisition**: Allow recruiters to adjust the 5 weights (e.g., 50% Skills, 10% Semantic) per specific requisition.
3. **Automated Skill Ontology Graphs**: Hierarchical skill clustering (e.g., PyTorch implying Python and Deep Learning).
4. **Third-Party ATS Webhooks**: Direct sync with Greenhouse, Lever, and Ashby.

---

## 📄 License
This project is open-source under the MIT License.
