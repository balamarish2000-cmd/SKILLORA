# SKILLORA – AI Career Development & Skill Intelligence Platform

> **"Learn Skills. Build Careers. Find Opportunities."**

SKILLORA is an AI-powered multi-sector career development platform built with **React + TypeScript + Vite + Tailwind CSS**, an **Express.js + TypeScript API server**, **SQLite persistence**, and **Google Gemini AI (`@google/genai`)**. It spans **9 major professional sectors**, **66 target roles** (with Indian market `₹ LPA` salary ranges), **76 prerequisite-mapped competencies**, and **228 verified learning resources**.

---

## Visual Identity & Theme System

- **Midnight Atlas (Dark Mode — Default)**: Deep Midnight Navy (`#101827`), Dark Slate (`#182337`), Card Surface (`#202D42`), Electric Teal accent (`#19D3C5`), Warm Amber highlight (`#F2B65D`), and Soft Ivory text (`#F4F1E8`).
- **Daylight Studio (Light Mode)**: Warm Paper (`#F5F3EC`), Crisp Cards (`#FFFFFF`), Deep Teal accent (`#087F78`), Slate Secondary (`#64748B`), and Navy text (`#172235`), persisted across sessions in `localStorage` (`skillora_theme`).

---

## Key Capabilities

1. **Account & Profile Onboarding**: Email/password registration and sign-in (`scrypt` password hashing), cross-sector resume parsing (paste text/JSON or upload `.txt`/`.md`/`.json`), specialization & preferred location setup, plus honest `0%` starting progress for new accounts.
2. **Personalized Dashboard**: Welcomes learners by name and location, visualizes skill gaps vs. target benchmarks on a Radar Chart, distinguishes `Assessment Verified` vs. `Resume / Self-Reported` skills, and highlights next recommended learning steps.
3. **Adaptive Prerequisite Roadmap**: Topological DAG ordering across `Fast Track`, `Balanced`, and `Deep Mastery` modes with 3-state step tracking (`Not Started`, `Started`, `Completed`), daily/weekly study pacing, and inspectable **Replan Diffs**.
4. **Educational Resource Hub & YouTube Lookup**: Filter 228 verified courses, docs, labs, and textbooks across 9 sectors, plus live **YouTube Tutorial Search** (uses `YOUTUBE_API_KEY` when configured, or returns a verified live YouTube search link without inventing video listings).
5. **Resume Studio**: Edit structured headline, specialization, location, summary, projects, education, and certifications; request **Gemini AI Polish** with explicit **Approve & Apply / Discard** review; export `.docx` (`docx`), `.txt`, or Print/Save PDF.
6. **Verified Opportunities & Application Tracker**: Opens live search portals on **LinkedIn, Naukri.com, Indeed India, Wellfound, Google Careers, Internshala, and Unstop** tailored to role, sector, and preferred location—with optional Gemini match/prep explanations and a SQLite-persisted external Application Tracker.
7. **Live Gemini AI Career Mentor**: Multi-turn Gemini chat grounded in the learner's profile, gaps, and roadmap, featuring 10 built-in interactive career questions, `Enter` to send / `Shift+Enter` newline, response copying, retry on error, and selective agent tracing.

---

## Transparency & Honesty Policies

- **Genuine Gemini AI**: Features requiring Gemini AI (`AI Mentor`, `Resume Polish`, `Opportunity Match Insights`) require a valid `GEMINI_API_KEY`. When missing or unavailable, SKILLORA surfaces a clear, actionable notice and never fakes AI replies.
- **No Fabricated Job Listings**: SKILLORA never invents fake company job vacancies or deadlines; it links to real verified job/internship search portals and lets you track real external applications.
- **Skill Provenance**: Clicking resources or marking roadmap steps `Completed` tracks study progress only. Skills upgrade to `Assessment Verified` only upon passing domain assessments.
- **Medical & Healthcare Disclaimer**: Healthcare assessments and roadmaps are strictly educational prep simulations and do not replace clinical licensure or accredited medical training.

---

## Local Setup & Verification

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Add GEMINI_API_KEY="..." (and optionally YOUTUBE_API_KEY="...")

# 3. Run unit & integration tests
npm test

# 4. Start full-stack dev server on port 3000
npm run dev

# 5. Production build & run
npm run build
NODE_ENV=production npm start
```
