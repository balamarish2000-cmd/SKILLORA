import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookMarked,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Cpu,
  FileCheck2,
  FileText,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Map as MapIcon,
  Menu,
  Palette,
  PlayCircle,
  Search,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import type { AIMode, CareerDomain, CareerDomainId } from '../shared/types';
import { SkilloraLogo } from './SkilloraLogo';

interface LandingViewProps {
  aiMode: AIMode;
  domains: CareerDomain[];
  resourceCount: number;
  skillCount: number;
  roleCount: number;
  onLaunchDemoWorkspace: () => void;
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenProfileBuilder: () => void;
  onOpenExplorerCategory: (domainId?: CareerDomainId) => void;
  onOpenLibrary: () => void;
  onOpenOpportunities: () => void;
  onOpenResumeStudio: () => void;
  onOpenRoadmap: () => void;
  onOpenMentor: () => void;
}

const DOMAIN_ICONS: Record<CareerDomainId, React.ComponentType<{ className?: string }>> = {
  information_technology: Code2,
  medical_healthcare: HeartPulse,
  mechanical_engineering: Wrench,
  electronics_electrical: Cpu,
  robotics_automation: Bot,
  civil_architecture: Building2,
  science_research: FlaskConical,
  business_management: Briefcase,
  design_creative: Palette,
  education_teaching: GraduationCap,
  finance_accounting: Landmark,
  agriculture_environmental: Sprout,
};

const PLATFORM_PILLARS = [
  {
    icon: Sparkles,
    title: 'AI Career Intelligence',
    description:
      'Analyze your skill profile against weighted industry rubrics to uncover high-impact strengths, readiness percentages, and realistic next roles.',
  },
  {
    icon: BarChart3,
    title: 'Smart Skill Analysis',
    description:
      'Separate resume-extracted evidence from self-reported skills and verified domain assessments on a transparent 0–5 proficiency scale.',
  },
  {
    icon: MapIcon,
    title: 'Personalized Learning',
    description:
      'Generate prerequisite-ordered roadmaps tailored to your weekly hours and study pace across Fast Track, Balanced, and Deep Mastery modes.',
  },
  {
    icon: Briefcase,
    title: 'Opportunity Discovery',
    description:
      'Connect your target role, preferred location, and ₹ LPA expectations directly to verified job and internship search portals with application tracking.',
  },
];

const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Discover Yourself',
    description: 'Create an account or parse your resume to map your academic background, projects, and interests.',
  },
  {
    step: '02',
    title: 'Analyze Your Skills',
    description: 'Benchmark your proficiency across 12 career sectors and validate core concepts with practical checks.',
  },
  {
    step: '03',
    title: 'Build Your Roadmap',
    description: 'Receive a dependency-ordered learning plan with estimated hours and milestone checkpoints.',
  },
  {
    step: '04',
    title: 'Learn and Improve',
    description: 'Study curated documentation and courses, complete projects, and update step progress in real time.',
  },
  {
    step: '05',
    title: 'Discover Opportunities',
    description: 'Refine your resume in Resume Studio and launch targeted searches on verified job and internship boards.',
  },
];

const RESOURCE_CATEGORIES = [
  {
    icon: PlayCircle,
    title: 'Video Tutorials',
    detail: 'Live YouTube tutorial search paired with topic-specific queries without fabricated links.',
  },
  {
    icon: GraduationCap,
    title: 'Online Courses',
    detail: 'University OpenCourseWare, MIT/Stanford lectures, and structured multi-week curricula.',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    detail: 'Official language specs, engineering handbooks, clinical guidelines, and regulatory standards.',
  },
  {
    icon: Code2,
    title: 'Practice Exercises',
    detail: 'Sandboxed coding tasks, quantitative engineering drills, and domain scenario labs.',
  },
  {
    icon: Layers,
    title: 'Applied Projects',
    detail: 'Practical milestone deliverables mapped to each roadmap skill so you build real proof.',
  },
  {
    icon: Award,
    title: 'Certifications',
    detail: 'Qualification path notes covering board licensure, PE/CA/CFA guidance, and industry credentials.',
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  aiMode,
  domains,
  resourceCount,
  skillCount,
  roleCount,
  onLaunchDemoWorkspace,
  onOpenSignIn,
  onOpenRegister,
  onOpenProfileBuilder,
  onOpenExplorerCategory,
  onOpenLibrary,
  onOpenOpportunities,
  onOpenResumeStudio,
  onOpenRoadmap,
  onOpenMentor,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#172B4D] overflow-x-hidden">
      {/* 1. Premium Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 h-16">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="flex items-center whitespace-nowrap shrink-0"
          >
            <SkilloraLogo />
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#64748B]"
          >
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('home');
              }}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#explore-careers"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('explore-careers');
              }}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
            >
              Explore Careers
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('features');
              }}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('how-it-works');
              }}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="px-4 py-2 text-sm font-semibold text-[#172B4D] hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              Get Started
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            className="lg:hidden p-2 rounded-lg border border-[#E2E8F0] text-[#172B4D] hover:border-[#2563EB] cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-5 py-4 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium text-[#172B4D]">
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className="text-left py-1.5 hover:text-[#2563EB] cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('explore-careers')}
                className="text-left py-1.5 hover:text-[#2563EB] cursor-pointer"
              >
                Explore Careers
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="text-left py-1.5 hover:text-[#2563EB] cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-1.5 hover:text-[#2563EB] cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="text-left py-1.5 hover:text-[#2563EB] cursor-pointer"
              >
                About
              </button>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenSignIn}
                className="flex-1 py-2.5 text-sm font-semibold text-[#172B4D] border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenRegister}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. Hero Section */}
        <section id="home" className="bg-white pt-10 pb-14 lg:pt-14 lg:pb-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="text-xs font-bold tracking-[0.14em] uppercase text-[#2563EB]">
                  YOUR FUTURE STARTS HERE
                </div>

                <h1
                  className="font-display font-extrabold tracking-tight text-[#172B4D] leading-[1.08]"
                  style={{ fontSize: 'clamp(2.25rem, 4.1vw, 3.5rem)' }}
                >
                  Turn Your Skills Into Your Future.
                </h1>

                <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
                  Discover Your Potential. Build Your Future. Your AI-powered career companion to
                  understand your skills, explore career paths, build personalized learning roadmaps
                  and discover meaningful opportunities.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={onOpenProfileBuilder}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                  >
                    <span>Build My Career Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onLaunchDemoWorkspace}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#172B4D] bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explore Demo Workspace</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#64748B] border-t border-[#E2E8F0]">
                  <span className="pt-3 text-[#172B4D] font-semibold">
                    One platform. Multiple career paths. Personalized guidance.
                  </span>
                  <span className="pt-3 text-[#2563EB] font-mono tabular-nums">
                    {domains.length || 12} Sectors · {roleCount} Roles · {skillCount} Skills · {resourceCount} Resources
                  </span>
                </div>
              </div>

              {/* Right Column: Authentic SKILLORA Product Dashboard Preview */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-[#E2E8F0] bg-[#EFF6FF] p-4 sm:p-5 shadow-sm">
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
                    {/* Preview Header: Career Profile Summary & Career Readiness Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
                          SKILLORA Workspace Preview · Sample Profile
                        </div>
                        <div className="mt-1 font-display text-lg font-bold text-[#172B4D]">
                          Maya Chen → Full Stack Developer
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Balanced Plan · 12 hrs/week · Target CTC ₹15–22 LPA
                        </div>
                      </div>

                      <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl px-4 py-2.5 text-right shrink-0">
                        <div className="text-[11px] font-medium text-[#64748B]">
                          Career Readiness
                        </div>
                        <div className="font-mono text-2xl font-extrabold text-[#2563EB] tabular-nums">
                          64%
                        </div>
                      </div>
                    </div>

                    {/* Skill Progress Visualization + Learning Roadmap Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-[#172B4D]">
                            Skill Progress
                          </span>
                          <span className="text-[11px] font-mono text-[#64748B]">0–5 Scale</span>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          {[
                            { name: 'Python & SQL', pct: 75, score: '3.8 / 5' },
                            { name: 'Git & Linux', pct: 65, score: '3.2 / 5' },
                            { name: 'JavaScript (ES2023+)', pct: 40, score: '2.0 / 5' },
                            { name: 'React Architecture', pct: 25, score: '1.3 / 5' },
                          ].map((bar) => (
                            <div key={bar.name}>
                              <div className="flex justify-between gap-2 text-[11px] mb-1">
                                <span className="font-medium text-[#172B4D] truncate">{bar.name}</span>
                                <span className="font-mono text-[#2563EB] tabular-nums whitespace-nowrap shrink-0">
                                  {bar.score}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-[#EFF6FF] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#2563EB]"
                                  style={{ width: `${bar.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-[#172B4D]">
                            Learning Roadmap
                          </span>
                          <span className="text-[11px] font-mono text-[#2563EB]">3 Next Steps</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-between gap-2">
                            <span className="font-medium text-[#172B4D] truncate">
                              01. HTML5 &amp; Responsive CSS
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-[#2563EB] shrink-0">
                              Done
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-[#2563EB]/40 flex items-center justify-between gap-2">
                            <span className="font-medium text-[#172B4D] truncate">
                              02. JavaScript &amp; Async Flows
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-[#1D4ED8] shrink-0">
                              Active
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between gap-2">
                            <span className="font-medium text-[#64748B] truncate">
                              03. React State &amp; TypeScript
                            </span>
                            <span className="font-mono text-[10px] text-[#64748B] shrink-0">
                              14h
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Mentor Preview Strip */}
                    <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3.5 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#2563EB] text-white shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-semibold text-[#172B4D]">
                          AI Mentor Preview · Priority Gap Guidance
                        </div>
                        <p className="mt-0.5 text-[#64748B] leading-relaxed">
                          &ldquo;Completing JavaScript ES2023+ unlocks React &amp; Node.js on your roadmap and raises your Full Stack readiness by +18%.&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Platform Overview */}
        <section id="features" className="bg-[#EFF6FF] border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Platform Overview
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                Everything You Need to Build Your Career
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-[#64748B] leading-relaxed">
                From resume parsing and multi-sector benchmarking to adaptive roadmaps and verified opportunity discovery, every capability works together in one unified workspace.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLATFORM_PILLARS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between hover:border-[#2563EB] transition-colors shadow-2xs"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Explore Career Paths (12 Categories) */}
        <section id="explore-careers" className="bg-white border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  12 Industry Sectors · {roleCount} Career Paths
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                  Explore Careers Across Every Industry
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#64748B] leading-relaxed">
                  Select any discipline to browse weighted role rubrics, ₹ LPA salary benchmarks, qualification guidance, and prerequisite skill paths.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenExplorerCategory()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] hover:border-[#2563EB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
              >
                <span>View All {roleCount} Roles</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {domains.map((dom, idx) => {
                const Icon = DOMAIN_ICONS[dom.id] ?? Compass;
                return (
                  <div
                    key={dom.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between hover:border-[#2563EB] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#64748B] tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-base font-bold text-[#172B4D]">
                        {dom.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
                        {dom.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => onOpenExplorerCategory(dom.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                      >
                        <span>Explore Careers</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. How SKILLORA Works */}
        <section id="how-it-works" className="bg-[#EFF6FF] border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Step-by-Step Workflow
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                Your Career Journey, Simplified
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#64748B]">
                Five clear stages take you from raw skills to verified readiness and targeted applications.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-5 gap-4">
              {JOURNEY_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between relative"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB] text-white font-mono text-xs font-bold tabular-nums">
                      {item.step}
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-[#172B4D]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. AI Career Intelligence */}
        <section className="bg-white border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                AI Career Intelligence
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                Meet Your Intelligent Career Companion
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                SKILLORA&apos;s AI Mentor connects directly to your live skill matrix, target role rubric, and roadmap pace to give grounded, practical answers—without generic boilerplate.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#172B4D]">
                {[
                  'Personalized career recommendations',
                  'Weighted skill gap analysis',
                  'Adaptive study planning',
                  'Interactive career Q&A',
                  'Progress & pace tracking',
                  'AI-assisted resume improvement',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenMentor}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Open AI Mentor</span>
                </button>
                <span className="text-xs font-medium text-[#64748B]">
                  Status:{' '}
                  <span className="font-semibold text-[#2563EB]">
                    {aiMode === 'gemini' ? 'Gemini AI Connected' : 'Gemini API Key Required for Live Mentor'}
                  </span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#EFF6FF] p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-[#2563EB]" />
                    <span>AI Mentor · Illustrative Workspace Preview</span>
                  </span>
                  <span className="font-mono text-[#2563EB]">Live Context Aware</span>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 text-xs">
                  <div className="bg-[#2563EB] text-white rounded-lg px-3.5 py-2.5 ml-auto max-w-[85%]">
                    Which missing skill should I learn first to raise my readiness for Full Stack Developer?
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg p-3.5 space-y-2 text-[#172B4D]">
                    <div className="font-mono text-[11px] font-semibold text-[#2563EB]">
                      Tools checked: explain_gap() · get_roadmap_next_steps()
                    </div>
                    <p className="leading-relaxed text-[#172B4D]">
                      Focus on <strong>JavaScript (ES2023+)</strong> first. It carries a 5/5 role weight and is a prerequisite for both React Architecture and Node.js APIs. At 12 hrs/week, finishing the next two roadmap modules keeps your target date on track.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Personalized Learning Roadmap */}
        <section className="bg-[#EFF6FF] border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
                      Illustrative Sample Roadmap
                    </div>
                    <div className="font-display text-base font-bold text-[#172B4D]">
                      Skill Assessment → Prerequisite Stages → Applied Proof
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-2.5 py-1 rounded-md">
                    Balanced · 38h Total
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      stage: 'Stage 1 · Skill Assessment & Foundations',
                      skill: 'HTML5, Modern CSS & Accessibility Audit',
                      resource: 'MDN Web Docs · 6h · Practice Lab',
                      status: 'Completed',
                    },
                    {
                      stage: 'Stage 2 · Core Required Skill',
                      skill: 'JavaScript (ES2023+) & Async Data Flows',
                      resource: 'JavaScript.info + Coding Check · 14h',
                      status: 'In Progress',
                    },
                    {
                      stage: 'Stage 3 · Applied Project & Verification',
                      skill: 'React & Component State Architecture',
                      resource: 'React Docs + Portfolio Project · 18h',
                      status: 'Not Started',
                    },
                  ].map((item) => (
                    <div
                      key={item.stage}
                      className="rounded-xl border border-[#E2E8F0] bg-[#EFF6FF]/40 p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-[#2563EB]">{item.stage}</div>
                        <div className="mt-0.5 font-semibold text-[#172B4D]">{item.skill}</div>
                        <div className="mt-0.5 text-[#64748B]">{item.resource}</div>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                          item.status === 'Completed'
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : item.status === 'In Progress'
                              ? 'bg-[#DBEAFE] text-[#1D4ED8] border-[#2563EB]/30'
                              : 'bg-white text-[#64748B] border-[#E2E8F0]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Personalized Learning Roadmap
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                Learn With a Clear Direction
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Every SKILLORA roadmap sequences skills in strict prerequisite order—starting with your initial skill assessment, linking verified resources and practice projects, and updating your forecasted readiness date as you mark steps Not Started, In Progress, or Completed.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-medium text-[#172B4D]">
                <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] px-3 py-2 rounded-lg">
                  <Target className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Fast Track / Balanced / Deep Mastery</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] px-3 py-2 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Auto-Remediation on Failed Checks</span>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenRoadmap}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                >
                  <span>Explore Interactive Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Learning Resource Hub */}
        <section className="bg-white border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  {resourceCount} Verified Learning Resources
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                  Everything You Need to Keep Learning
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#64748B]">
                  Filter verified courses, documentation, labs, and textbooks across all 12 sectors, or run a live YouTube tutorial query without invented links.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenLibrary}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
              >
                <BookMarked className="w-4 h-4" />
                <span>Explore Resource Hub</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {RESOURCE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#2563EB] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-display text-base font-bold text-[#172B4D]">
                        {cat.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm text-[#64748B] leading-relaxed">{cat.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. Jobs and Internship Opportunities */}
        <section className="bg-[#EFF6FF] border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Jobs &amp; Internships Discovery
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                Turn Your Skills Into Opportunities
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Launch direct, location-aware searches across LinkedIn, Naukri, Indeed India, Wellfound, Google Careers, Internshala, and Unstop—paired with skill readiness alignment, ₹ LPA salary targets, and an integrated application tracker.
              </p>
              <p className="text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg p-3.5 leading-relaxed">
                <strong className="text-[#172B4D]">Transparent Discovery Guarantee:</strong> SKILLORA never invents fake companies, deadlines, or vacancies. All links open real search queries on official hiring portals.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenOpportunities}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Explore Job &amp; Internship Search</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <div className="text-xs font-bold text-[#172B4D]">
                      Verified Opportunity Channels
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Matched to Target Role, Location &amp; Indian Rupee (₹ LPA) Target
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                </div>

                {[
                  {
                    portal: 'LinkedIn Jobs & Internships',
                    desc: 'Live role search filtered by target title and preferred city',
                    tag: 'Verified Search URL',
                  },
                  {
                    portal: 'Naukri.com & Indeed India',
                    desc: 'Full-time industry openings with Indian CTC alignment',
                    tag: 'India Jobs',
                  },
                  {
                    portal: 'Internshala & Unstop',
                    desc: 'Student internships, trainee tracks, and hiring challenges',
                    tag: 'Internships',
                  },
                ].map((ch) => (
                  <div
                    key={ch.portal}
                    className="rounded-xl border border-[#E2E8F0] bg-[#EFF6FF]/40 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#172B4D]">{ch.portal}</div>
                      <div className="text-xs text-[#64748B] mt-0.5">{ch.desc}</div>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[#2563EB] bg-white border border-[#DBEAFE] px-2.5 py-1 rounded shrink-0">
                      {ch.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 10. Resume Studio */}
        <section className="bg-white border-t border-[#E2E8F0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#EFF6FF] p-5">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <div className="font-display text-base font-bold text-[#172B4D]">
                        Resume Studio Document Preview
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Structured Summary · Skill Highlights · Project Proof · Print/PDF Ready
                      </div>
                    </div>
                    <FileCheck2 className="w-5 h-5 text-[#2563EB]" />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#EFF6FF]/60 border border-[#DBEAFE]">
                      <div className="font-semibold text-[#2563EB] mb-1">
                        Professional Summary (AI Polish Ready)
                      </div>
                      <p className="text-[#172B4D] leading-relaxed">
                        Data &amp; Systems Analyst with 2+ years automating Python ETL pipelines and PostgreSQL reporting workflows, actively advancing React and TypeScript engineering readiness.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-[#E2E8F0]">
                        <div className="font-semibold text-[#172B4D] mb-1">Verified Skills</div>
                        <div className="text-[#64748B]">Python, SQL, Pandas, Git, Linux</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[#E2E8F0]">
                        <div className="font-semibold text-[#172B4D] mb-1">Targeted Gaps</div>
                        <div className="text-[#2563EB]">JavaScript ES2023+, React</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Resume Studio
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#172B4D]">
                Build a Resume That Reflects Your Skills
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Organize your education, experience, certifications, and project deliverables in one place. Use Gemini AI to refine summaries and project impact bullets for your target role, and export a clean print-ready resume sheet anytime.
              </p>
              <ul className="space-y-2 text-sm text-[#172B4D]">
                {[
                  'Create, edit, and sync resume records with your live skill profile',
                  'Skill-based tailoring suggestions aligned to your target career',
                  'Clean printable & PDF-ready formatting without layout clutter',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenResumeStudio}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Explore Resume Studio</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Final Call to Action */}
        <section className="bg-[#2563EB] text-white py-16">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Your Future Is Waiting. Start Building It Today.
            </h2>
            <p className="text-base sm:text-lg text-[#DBEAFE] max-w-2xl mx-auto leading-relaxed">
              Take the first step toward understanding your potential and creating a career you are proud of.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={onOpenRegister}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#2563EB] bg-white hover:bg-[#EFF6FF] rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <span>Create My Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLaunchDemoWorkspace}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#1D4ED8] border border-white/30 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              >
                <span>Explore SKILLORA</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 12. Professional Footer */}
      <footer id="about" className="bg-white border-t border-[#E2E8F0] pt-14 pb-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#E2E8F0]">
            <div className="md:col-span-4 space-y-4">
              <SkilloraLogo subtitle="Discover Your Potential. Build Your Future." />
              <p className="text-sm text-[#64748B] leading-relaxed max-w-sm">
                SKILLORA is an AI-powered career companion built to map your skills accurately, build personalized prerequisite roadmaps, and connect you with real opportunities across 12 industries.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Platform
              </div>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('home')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('features')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onLaunchDemoWorkspace}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Demo Workspace
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Career Categories
              </div>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenExplorerCategory('information_technology')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    IT &amp; Software
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenExplorerCategory('medical_healthcare')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Medical &amp; Healthcare
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenExplorerCategory('robotics_automation')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Robotics &amp; Automation
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenExplorerCategory('finance_accounting')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Finance &amp; Accounting
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenExplorerCategory()}
                    className="font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    Explore All 12 Sectors →
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Workspace &amp; Legal
              </div>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li>
                  <button
                    type="button"
                    onClick={onOpenLibrary}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Learning Resource Hub
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenResumeStudio}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Resume Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenOpportunities}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Job &amp; Internship Search
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="hover:text-[#2563EB] cursor-pointer"
                  >
                    Terms and Conditions
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
            <div>© {new Date().getFullYear()} SKILLORA. All rights reserved.</div>
            <div>Discover Your Potential. Build Your Future.</div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy & Terms Modals */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 bg-[#172B4D]/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
              <h3 id="legal-modal-title" className="font-display text-lg font-bold text-[#172B4D]">
                {legalModal === 'privacy' ? 'SKILLORA Privacy Policy' : 'SKILLORA Terms and Conditions'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close legal dialog"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#EFF6FF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {legalModal === 'privacy' ? (
              <div className="text-sm text-[#64748B] space-y-3 leading-relaxed">
                <p>
                  SKILLORA stores your career profile, parsed skills, roadmap progress, and tracked applications locally in your workspace SQLite database.
                </p>
                <p>
                  When Gemini AI features (Resume Parsing, AI Mentor, Resume Enhancement, or Opportunity Insights) are invoked, only the relevant prompt context is transmitted securely via server-side API calls. No personal data is sold or shared with third-party advertisers.
                </p>
              </div>
            ) : (
              <div className="text-sm text-[#64748B] space-y-3 leading-relaxed">
                <p>
                  SKILLORA provides educational career planning, skill gap analysis, and verified search links to third-party hiring portals. Healthcare and regulated profession modules are strictly educational and do not substitute for accredited licensure or clinical judgment.
                </p>
                <p>
                  Compensation ranges shown in Indian Rupees (₹ LPA) and demand growth figures are reference benchmarks only and do not guarantee employment offers or salaries.
                </p>
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
