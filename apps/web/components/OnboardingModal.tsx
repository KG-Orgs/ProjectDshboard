'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  Cloud,
  FileSearch,
  HardHat,
  Highlighter,
  MessageSquareText,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useAuthStore } from '@contractor/shared';
import { completeOnboarding } from '../lib/onboarding';
import {
  persistUserJobRole,
  readStoredUserJobRole,
  USER_JOB_ROLE_OPTIONS,
} from '../lib/user-role';
import './onboarding.css';

export interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string | null;
}

interface OnboardingStep {
  id: string;
  stepLabel: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  highlights: Array<{ icon: LucideIcon; text: string }>;
  tip?: string;
  interactive?: 'role';
}

function buildSteps(projectName?: string | null): OnboardingStep[] {
  const projectRef = projectName?.trim() ? projectName.trim() : 'MLJ-017';

  return [
    {
      id: 'welcome',
      stepLabel: 'Welcome',
      title: 'Construction document intelligence',
      subtitle: 'Search, review, and collaborate on project files — powered by AI.',
      description:
        'ContractorAI indexes drawings, specs, RFIs, submittals, and meeting minutes from your OneDrive so your team can find answers fast without digging through folders.',
      icon: Building2,
      highlights: [
        { icon: Sparkles, text: 'Semantic search across your entire project corpus' },
        { icon: FileSearch, text: 'Source citations link straight to the original document' },
        { icon: Cloud, text: 'Files stay in Microsoft OneDrive — we only read and index' },
      ],
    },
    {
      id: 'connect',
      stepLabel: 'Connect project',
      title: 'Link your project folder',
      subtitle: `Select a OneDrive folder like ${projectRef} to get started.`,
      description:
        'From the dashboard, connect Microsoft OneDrive and choose your project folder. ContractorAI syncs supported files and builds a searchable index your whole team can use.',
      icon: Cloud,
      highlights: [
        { icon: Cloud, text: 'One-click Microsoft sign-in and OneDrive connection' },
        { icon: Building2, text: 'Browse folders or paste a folder URL to set up a project' },
        { icon: Sparkles, text: 'Indexing runs in the background — check progress on the dashboard' },
      ],
      tip: 'Already on a shared demo? Your team may see pre-indexed projects like MLJ-017 — just select one and open the workspace.',
    },
    {
      id: 'role',
      stepLabel: 'Your role',
      title: 'What is your role on this project?',
      subtitle: 'This helps tailor your AI assistant. You can type any role.',
      description: '',
      icon: HardHat,
      highlights: [],
      interactive: 'role',
    },
    {
      id: 'chat',
      stepLabel: 'AI chat',
      title: 'Chat with your documents',
      subtitle: 'Ask questions in plain English — get cited answers.',
      description:
        'Open the workspace and use the AI assistant panel to ask about specs, schedules, RFIs, submittals, or meeting action items. Every answer references the source files.',
      icon: MessageSquareText,
      highlights: [
        { icon: MessageSquareText, text: '"What is the concrete strength for Level 3?" — instant retrieval' },
        { icon: FileSearch, text: 'Tap a citation to jump to the exact page in the viewer' },
        { icon: Sparkles, text: 'Follow-up questions keep context across the conversation' },
      ],
    },
    {
      id: 'viewer',
      stepLabel: 'PDF review',
      title: 'Review plans with markups & citations',
      subtitle: 'A three-panel workspace built for construction docs.',
      description:
        'Browse project files on the left, open PDFs in the center viewer, and chat on the right. Add markup annotations, zoom and pan drawings, and follow citation links from chat.',
      icon: Highlighter,
      highlights: [
        { icon: FileSearch, text: 'Files rail — filter and open any indexed document' },
        { icon: Highlighter, text: 'Markup toolbar for review comments and punch-style notes' },
        { icon: ArrowRight, text: 'Citations from chat open the PDF at the right page automatically' },
      ],
    },
    {
      id: 'team',
      stepLabel: 'Your team',
      title: 'Invite teammates to the same index',
      subtitle: 'Everyone signs in with Microsoft and shares one project database.',
      description:
        'Teammates authenticate with their Microsoft account and connect to the shared project index. No duplicate uploads — everyone searches the same corpus and sees consistent AI answers.',
      icon: Users,
      highlights: [
        { icon: Users, text: 'Share the demo URL — teammates sign in with Microsoft OAuth' },
        { icon: Cloud, text: 'Shared Neon database keeps projects and indexes in sync' },
        { icon: Building2, text: 'Each user connects their own OneDrive for file sync' },
      ],
      tip: 'For demos, Kyle can provision access to the shared MLJ-017 index so new users skip manual setup.',
    },
  ];
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
  }),
};

export default function OnboardingModal({ open, onOpenChange, projectName }: OnboardingModalProps) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const steps = useMemo(() => buildSteps(projectName), [projectName]);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [userJobRole, setUserJobRole] = useState(() => readStoredUserJobRole());

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const StepIcon = step.icon;

  const resolvedJobRole = useMemo(() => {
    const trimmed = userJobRole.trim();
    return trimmed || 'Team Member';
  }, [userJobRole]);

  const closeAndPersist = useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const savedRole = persistUserJobRole(userJobRole);
      const updatedUser = await completeOnboarding(savedRole);
      setAuth(updatedUser);
      onOpenChange(false);
      setStepIndex(0);
      setDirection(1);
    } catch {
      // Keep the modal open so the user can retry.
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onOpenChange, setAuth, userJobRole]);

  const handleSkip = useCallback(() => {
    void closeAndPersist();
  }, [closeAndPersist]);

  const handleNext = useCallback(() => {
    if (isLast) {
      void closeAndPersist();
      return;
    }
    setDirection(1);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [closeAndPersist, isLast, steps.length]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setStepIndex(0);
    setDirection(1);
  }, [onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="onboarding-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.div
            className="onboarding-modal"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="onboarding-modal__hero">
              <div className="onboarding-modal__hero-top">
                <div className="onboarding-modal__brand">
                  <div className="onboarding-modal__logo" aria-hidden>
                    AI
                  </div>
                  <span className="onboarding-modal__brand-text">ContractorAI</span>
                </div>
                <button
                  type="button"
                  className="onboarding-modal__close"
                  onClick={handleClose}
                  aria-label="Close tour"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>

              <motion.div
                key={`icon-${step.id}`}
                className="onboarding-modal__icon-wrap onboarding-modal__icon-pulse"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <StepIcon size={28} strokeWidth={1.75} aria-hidden />
              </motion.div>

              <p className="onboarding-modal__step-label">
                Step {stepIndex + 1} of {steps.length} · {step.stepLabel}
              </p>
              <h2 id="onboarding-title" className="onboarding-modal__title">
                {step.title}
              </h2>
              <p className="onboarding-modal__subtitle">{step.subtitle}</p>

              <div className="onboarding-modal__progress" aria-hidden>
                {steps.map((item, index) => (
                  <div
                    key={item.id}
                    className={[
                      'onboarding-modal__progress-dot',
                      index < stepIndex ? 'done' : '',
                      index === stepIndex ? 'active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </div>
            </div>

            <div className="onboarding-modal__body">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {step.description ? (
                    <p className="onboarding-modal__description">{step.description}</p>
                  ) : null}
                  {step.interactive === 'role' ? (
                    <div className="onboarding-modal__role">
                      <label className="onboarding-modal__role-label" htmlFor="onboarding-job-role">
                        Your role
                      </label>
                      <input
                        id="onboarding-job-role"
                        type="text"
                        className="onboarding-modal__role-input"
                        value={userJobRole}
                        onChange={(event) => setUserJobRole(event.target.value)}
                        placeholder="e.g. Project Engineer, Superintendent..."
                      />
                      <div className="onboarding-modal__role-chips">
                        {USER_JOB_ROLE_OPTIONS.map((role) => (
                          <button
                            key={role}
                            type="button"
                            className={[
                              'onboarding-modal__role-chip',
                              userJobRole === role ? 'selected' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => setUserJobRole(role)}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      <p className="onboarding-modal__role-hint">
                        Selected: {resolvedJobRole}
                      </p>
                    </div>
                  ) : (
                    <ul className="onboarding-modal__highlights">
                      {step.highlights.map((highlight) => {
                        const HighlightIcon = highlight.icon;
                        return (
                          <li key={highlight.text} className="onboarding-modal__highlight">
                            <HighlightIcon
                              size={16}
                              className="onboarding-modal__highlight-icon"
                              aria-hidden
                            />
                            <span>{highlight.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {step.tip ? <p className="onboarding-modal__tip">{step.tip}</p> : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="onboarding-modal__footer">
              <div className="onboarding-modal__footer-left">
                <button type="button" className="onboarding-modal__skip" onClick={handleSkip} disabled={isSaving}>
                  Skip · don&apos;t show again
                </button>
              </div>
              <div className="onboarding-modal__nav">
                {!isFirst ? (
                  <button
                    type="button"
                    className="onboarding-modal__btn onboarding-modal__btn-secondary"
                    onClick={handleBack}
                  >
                    <ChevronLeft size={16} aria-hidden />
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  className="onboarding-modal__btn onboarding-modal__btn-primary"
                  onClick={handleNext}
                  disabled={isSaving}
                >
                  {isLast ? 'Get started' : 'Next'}
                  {!isLast ? <ArrowRight size={16} aria-hidden /> : null}
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
