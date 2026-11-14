import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Bot,
  Briefcase,
  Code2,
  FileText,
  GitBranch,
  Globe,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Menu,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { api, type CatalogResponse } from './api';
import { AssessmentView } from './components/AssessmentView';
import { CareerExplorerView } from './components/CareerExplorerView';
import { CohortAdminView } from './components/CohortAdminView';
import { DashboardView } from './components/DashboardView';
import { LandingView } from './components/LandingView';
import { MentorView } from './components/MentorView';
import { OnboardingView } from './components/OnboardingView';
import { OpportunitiesView } from './components/OpportunitiesView';
import { ResourceLibraryView } from './components/ResourceLibraryView';
import { ResumeStudioView } from './components/ResumeStudioView';
import { RoadmapView } from './components/RoadmapView';
import { SettingsView } from './components/SettingsView';
import { SkilloraLogo } from './components/SkilloraLogo';
import { ReplanDiffModal, TraceDiffView } from './components/TraceDiffView';
import { TransitionSimulatorView } from './components/TransitionSimulatorView';
import type {
  AuthUser,
  CareerDomainId,
  LearningPlanMode,
  RoadmapStepStatus,
  RoleId,
  TwinSnapshot,
} from './shared/types';
import type { OnboardingTab } from './components/OnboardingView';

type ScreenId =
  | 'landing'
  | 'dashboard'
  | 'onboarding'
  | 'resume'
  | 'explorer'
  | 'transition'
  | 'roadmap'
  | 'library'
  | 'assessment'
  | 'opportunities'
  | 'mentor'
  | 'trace'
  | 'cohort'
  | 'settings';

const PROFILE_STORAGE_KEY = 'skillora_profile_id';
const AUTH_USER_STORAGE_KEY = 'skillora_auth_user';

const NAV_ITEMS: Array<{
  id: Exclude<ScreenId, 'landing'>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'onboarding', label: 'Account & Profile', icon: UserPlus },
  { id: 'resume', label: 'Resume Studio', icon: FileText },
  { id: 'explorer', label: 'Career Explorer', icon: Globe },
  { id: 'transition', label: 'Transition Sim', icon: ArrowLeftRight },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
  { id: 'library', label: 'Resource Hub', icon: BookOpen },
  { id: 'assessment', label: 'Assessments', icon: Code2 },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'mentor', label: 'AI Mentor', icon: Bot },
  { id: 'trace', label: 'Trace & Diff', icon: Activity },
  { id: 'cohort', label: 'Cohort Admin', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function readStoredAuthUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function readStoredProfileId(): string | null {
  try {
    return window.localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen') as ScreenId | null;
    if (screenParam && NAV_ITEMS.some((n) => n.id === screenParam)) {
      return screenParam;
    }
    return params.get('autostart') === '1' ? 'dashboard' : 'landing';
  });

  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [twin, setTwin] = useState<TwinSnapshot | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => readStoredAuthUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assessmentSkillId, setAssessmentSkillId] = useState<string | undefined>(undefined);
  const [transitionTargetRoleId, setTransitionTargetRoleId] = useState<RoleId | undefined>(undefined);
  const [explorerDomainFilter, setExplorerDomainFilter] = useState<'all' | CareerDomainId>('all');
  const [onboardingTab, setOnboardingTab] = useState<OnboardingTab>('resume_builder');
  const [onboardingAuthMode, setOnboardingAuthMode] = useState<'register' | 'login'>('register');
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [screen]);

  const persistActiveSession = (profileId: string, user: AuthUser | null) => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, profileId);
      if (user) {
        window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
    setAuthUser(user);
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedProfileId = readStoredProfileId();
      const cat = await api.getCatalog();
      setCatalog(cat);

      if (storedProfileId && storedProfileId !== 'twin_demo_maya') {
        try {
          const activeTwin = await api.getProfile(storedProfileId);
          setTwin(activeTwin);
          return;
        } catch {
          persistActiveSession('twin_demo_maya', null);
        }
      }

      const demoTwin = await api.getDemoTwin();
      setTwin(demoTwin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to SKILLORA backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshTwin = async (id: string) => {
    const updated = await api.getProfile(id);
    setTwin(updated);
  };

  const handleSwitchRole = async (roleId: RoleId) => {
    if (!twin) return;
    try {
      const updated = await api.updateGoal({
        profileId: twin.profile.id,
        targetRoleId: roleId,
      });
      setTwin(updated);
      setDiffModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch role');
    }
  };

  const handleSetTargetRoleFromExplorer = async (roleId: RoleId) => {
    if (!twin) return;
    try {
      const updated = await api.updateGoal({
        profileId: twin.profile.id,
        targetRoleId: roleId,
      });
      setTwin(updated);
      setScreen('roadmap');
      setDiffModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update target role');
    }
  };

  const handleChangeLearningPlan = async (learningPlan: LearningPlanMode) => {
    if (!twin) return;
    try {
      const prevDiffId = twin.latestDiff?.id;
      const updated = await api.updateGoal({
        profileId: twin.profile.id,
        targetRoleId: twin.profile.targetRoleId,
        learningPlan,
      });
      setTwin(updated);
      if (updated.latestDiff && updated.latestDiff.id !== prevDiffId) {
        setDiffModalOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch learning plan');
    }
  };

  const handleUpdateStepStatus = async (stepId: string, status: RoadmapStepStatus) => {
    if (!twin) return;
    const updated = await api.updateProgress({
      profileId: twin.profile.id,
      stepId,
      status,
      completed: status === 'completed',
    });
    setTwin(updated);
  };

  const handleStartAssessmentForSkill = (skillId: string) => {
    setAssessmentSkillId(skillId);
    setScreen('assessment');
    setMobileMenuOpen(false);
  };

  const handleSimulateTransitionTo = (toRoleId: RoleId) => {
    setTransitionTargetRoleId(toRoleId);
    setScreen('transition');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (next: ScreenId) => {
    setScreen(next);
    setMobileMenuOpen(false);
  };

  const handleSwitchToDemo = async () => {
    try {
      const demo = await api.getDemoTwin();
      persistActiveSession(demo.profile.id, null);
      setTwin(demo);
      setScreen('dashboard');
      setMobileMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo workspace');
    }
  };

  if (loading && !catalog) {
    return (
      <div className="min-h-screen bg-pp-bg flex items-center justify-center gap-2.5 text-sm text-pp-text-muted">
        <Loader2 className="w-5 h-5 animate-spin text-pp-accent" />
        <span>Initializing SKILLORA Career Workspace...</span>
      </div>
    );
  }

  const handleOpenOnboarding = (tab: OnboardingTab, authMode: 'register' | 'login' = 'register') => {
    setOnboardingTab(tab);
    setOnboardingAuthMode(authMode);
    setScreen('onboarding');
    setMobileMenuOpen(false);
  };

  const handleOpenExplorerCategory = (domainId?: CareerDomainId) => {
    setExplorerDomainFilter(domainId ?? 'all');
    setScreen('explorer');
    setMobileMenuOpen(false);
  };

  if (screen === 'landing') {
    return (
      <LandingView
        aiMode={catalog?.aiMode ?? 'deterministic_fallback'}
        domains={catalog?.domains ?? []}
        resourceCount={catalog?.resources.length ?? 258}
        skillCount={catalog?.skills.length ?? 86}
        roleCount={catalog?.roles.length ?? 75}
        onLaunchDemoWorkspace={() => {
          void handleSwitchToDemo();
        }}
        onOpenSignIn={() => handleOpenOnboarding('account', 'login')}
        onOpenRegister={() => handleOpenOnboarding('account', 'register')}
        onOpenProfileBuilder={() => handleOpenOnboarding('resume_builder', 'register')}
        onOpenExplorerCategory={handleOpenExplorerCategory}
        onOpenLibrary={() => handleNavigate('library')}
        onOpenOpportunities={() => handleNavigate('opportunities')}
        onOpenResumeStudio={() => handleNavigate('resume')}
        onOpenRoadmap={() => handleNavigate('roadmap')}
        onOpenMentor={() => handleNavigate('mentor')}
      />
    );
  }

  const aiMode = twin?.aiMode ?? catalog?.aiMode ?? 'deterministic_fallback';
  const currentLabel = NAV_ITEMS.find((n) => n.id === screen)?.label ?? 'Workspace';

  return (
    <div className="min-h-screen bg-pp-bg text-pp-text flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-pp-surface border-r border-pp-border">
        <div className="h-16 px-5 flex items-center justify-between border-b border-pp-border">
          <button
            type="button"
            onClick={() => handleNavigate('landing')}
            className="flex items-center cursor-pointer whitespace-nowrap"
          >
            <SkilloraLogo subtitle="Career Intelligence" />
          </button>
        </div>

        <nav aria-label="Workspace navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-pp-accent-soft text-pp-accent font-semibold border border-pp-accent/30'
                    : 'text-pp-text-muted hover:bg-pp-card hover:text-pp-text border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-pp-accent' : 'text-pp-text-muted'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {twin && (
          <div className="p-4 border-t border-pp-border text-xs space-y-2 bg-pp-bg/60">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-pp-text truncate">{twin.profile.name}</div>
              {authUser ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleSwitchToDemo();
                  }}
                  title="Sign out to demo workspace"
                  aria-label="Sign out"
                  className="text-pp-text-muted hover:text-pp-error cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[10px] font-mono text-pp-amber shrink-0">Demo</span>
              )}
            </div>
            <div className="text-pp-text-muted truncate">{twin.analysis.targetRoleTitle}</div>
            <div className="font-mono text-pp-accent font-semibold tabular-nums">
              {twin.analysis.overallReadiness}% Ready · {twin.progress.remainingHours}h left
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-full bg-pp-surface h-full border-r border-pp-border flex flex-col z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-pp-border">
              <SkilloraLogo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 text-pp-text-muted hover:text-pp-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Mobile workspace navigation" className="p-3 space-y-1 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = screen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-pp-accent-soft text-pp-accent font-semibold border border-pp-accent/30'
                        : 'text-pp-text-muted hover:text-pp-text hover:bg-pp-card border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="h-16 bg-pp-surface border-b border-pp-border px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-pp-text-muted hover:text-pp-text rounded-lg hover:bg-pp-card cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-pp-text-muted truncate">
              <button
                type="button"
                onClick={() => handleNavigate('landing')}
                className="hover:text-pp-text cursor-pointer whitespace-nowrap font-display font-semibold"
              >
                SKILLORA
              </button>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-pp-text truncate">{currentLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span
              data-testid="ai-mode-badge"
              className={`hidden sm:inline-block text-xs font-medium whitespace-nowrap ${
                aiMode === 'gemini' ? 'text-pp-accent' : 'text-pp-text-muted'
              }`}
            >
              {aiMode === 'gemini' ? 'Gemini AI: Connected' : 'Gemini AI: Key Required for Mentor'}
            </span>

            {twin?.latestDiff && (
              <button
                type="button"
                onClick={() => setDiffModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-text bg-pp-elevated border border-pp-border hover:border-pp-accent rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-pp-accent" />
                <span className="hidden sm:inline">Replan Diff</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div
              role="alert"
              className="mb-6 bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-4 no-print"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {screen === 'onboarding' && catalog && (
            <OnboardingView
              domains={catalog.domains}
              roles={catalog.roles}
              skillsCatalog={catalog.skills}
              sampleResumes={catalog.sampleResumes}
              initialTab={onboardingTab}
              initialAuthMode={onboardingAuthMode}
              onTwinCreated={(newTwin, user) => {
                persistActiveSession(newTwin.profile.id, user ?? null);
                setTwin(newTwin);
                setScreen('dashboard');
              }}
            />
          )}

          {screen === 'resume' && twin && catalog && (
            <ResumeStudioView
              twin={twin}
              domains={catalog.domains}
              onTwinUpdated={(nextTwin) => setTwin(nextTwin)}
            />
          )}

          {screen === 'dashboard' && twin && catalog && (
            <DashboardView
              twin={twin}
              domains={catalog.domains}
              onStartAssessmentForSkill={handleStartAssessmentForSkill}
              onOpenRoadmap={() => handleNavigate('roadmap')}
              onOpenMentor={() => handleNavigate('mentor')}
              onOpenOpportunities={() => handleNavigate('opportunities')}
              onOpenOnboarding={() => handleOpenOnboarding('resume_builder', 'register')}
              onOpenReplanDiff={() => setDiffModalOpen(true)}
              onOpenTransitionSimulator={() => handleNavigate('transition')}
              onSwitchRole={handleSwitchRole}
            />
          )}

          {screen === 'explorer' && twin && catalog && (
            <CareerExplorerView
              domains={catalog.domains}
              roles={catalog.roles}
              skills={catalog.skills}
              twin={twin}
              initialDomainFilter={explorerDomainFilter}
              onSetTargetRole={(roleId) => {
                void handleSetTargetRoleFromExplorer(roleId);
              }}
              onSimulateTransitionTo={handleSimulateTransitionTo}
            />
          )}

          {screen === 'transition' && twin && catalog && (
            <TransitionSimulatorView
              domains={catalog.domains}
              roles={catalog.roles}
              twin={twin}
              initialToRoleId={transitionTargetRoleId}
              onTransitionApplied={(nextTwin) => {
                setTwin(nextTwin);
                setScreen('roadmap');
                if (nextTwin.latestDiff) {
                  setDiffModalOpen(true);
                }
              }}
            />
          )}

          {screen === 'roadmap' && twin && (
            <RoadmapView
              twin={twin}
              onUpdateStepStatus={handleUpdateStepStatus}
              onChangeLearningPlan={handleChangeLearningPlan}
              onOpenReplanDiff={() => setDiffModalOpen(true)}
              onStartAssessmentForSkill={handleStartAssessmentForSkill}
            />
          )}

          {screen === 'library' && catalog && (
            <ResourceLibraryView
              domains={catalog.domains}
              skills={catalog.skills}
              resources={catalog.resources}
            />
          )}

          {screen === 'assessment' && twin && catalog && (
            <AssessmentView
              twin={twin}
              domains={catalog.domains}
              skillsCatalog={catalog.skills}
              initialSkillId={assessmentSkillId}
              onAssessmentCompleted={() => {
                void refreshTwin(twin.profile.id);
              }}
              onOpenReplanDiff={() => setDiffModalOpen(true)}
            />
          )}

          {screen === 'opportunities' && twin && catalog && (
            <OpportunitiesView twin={twin} domains={catalog.domains} />
          )}

          {screen === 'mentor' && twin && (
            <MentorView
              twin={twin}
              onTwinUpdated={(nextTwin) => setTwin(nextTwin)}
            />
          )}

          {screen === 'trace' && twin && <TraceDiffView twin={twin} />}

          {screen === 'cohort' && <CohortAdminView />}

          {screen === 'settings' && twin && catalog && (
            <SettingsView
              twin={twin}
              domains={catalog.domains}
              roles={catalog.roles}
              onTwinUpdated={(nextTwin, showDiff) => {
                setTwin(nextTwin);
                if (showDiff && nextTwin.latestDiff) {
                  setDiffModalOpen(true);
                }
              }}
              onResetDemo={() => {
                void handleSwitchToDemo();
              }}
            />
          )}
        </main>
      </div>

      <ReplanDiffModal
        diff={twin?.latestDiff ?? null}
        open={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
      />
    </div>
  );
}
