"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  adminTourSteps,
  dismissAdminTourPrompt,
  hasCompletedAdminTour,
  hasDismissedAdminTourPrompt,
  markAdminTourCompleted,
  type AdminTourStep,
} from "@/lib/admin-walkthrough";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type AdminTourContextValue = {
  startTour: () => void;
  finishTour: () => void;
  active: boolean;
};

const AdminTourContext = createContext<AdminTourContextValue | null>(null);

export function useAdminTour() {
  const context = useContext(AdminTourContext);
  if (!context) {
    throw new Error("useAdminTour must be used within AdminTourProvider");
  }
  return context;
}

function measureTarget(selector?: string): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const node = document.querySelector(selector);
  if (!node) return null;
  const box = node.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPopoverPosition(target: Rect | null) {
  const cardWidth = 352;
  const cardHeight = 240;
  const margin = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!target) {
    return {
      top: clamp(
        viewportHeight / 2 - cardHeight / 2,
        margin,
        viewportHeight - cardHeight - margin
      ),
      left: clamp(
        viewportWidth / 2 - cardWidth / 2,
        margin,
        viewportWidth - cardWidth - margin
      ),
    };
  }

  const preferBelow =
    target.top + target.height + 12 + cardHeight < viewportHeight - margin;
  const top = preferBelow
    ? target.top + target.height + 12
    : clamp(
        target.top - cardHeight - 12,
        margin,
        viewportHeight - cardHeight - margin
      );

  let left = target.left + target.width / 2 - cardWidth / 2;
  left = clamp(left, margin, viewportWidth - cardWidth - margin);

  return { top, left };
}

type ProviderProps = {
  children: React.ReactNode;
  openNav?: () => void;
};

export function AdminTourProvider({ children, openNav }: ProviderProps) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const step = adminTourSteps[stepIndex];
  const isLastStep = stepIndex === adminTourSteps.length - 1;

  const refreshTarget = useCallback(
    (currentStep: AdminTourStep) => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        openNav?.();
      }
      requestAnimationFrame(() => {
        setTargetRect(measureTarget(currentStep.target));
      });
    },
    [openNav]
  );

  const finishTour = useCallback(() => {
    markAdminTourCompleted();
    setActive(false);
    setStepIndex(0);
    setTargetRect(null);
  }, []);

  const startTour = useCallback(() => {
    dismissAdminTourPrompt();
    setStepIndex(0);
    setActive(true);
    window.setTimeout(() => refreshTarget(adminTourSteps[0]), 0);
  }, [refreshTarget]);

  const goToStep = useCallback(
    (index: number) => {
      const nextStep = adminTourSteps[index];
      if (!nextStep) return;

      if (nextStep.navigateTo) {
        router.push(nextStep.navigateTo);
      }

      setStepIndex(index);
      window.setTimeout(() => refreshTarget(nextStep), nextStep.navigateTo ? 350 : 0);
    },
    [refreshTarget, router]
  );

  useLayoutEffect(() => {
    if (!active || !step) return;

    refreshTarget(step);

    function handleLayoutChange() {
      refreshTarget(step);
    }

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [active, step, refreshTarget]);

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finishTour();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, finishTour]);

  const value = useMemo(
    () => ({ startTour, finishTour, active }),
    [startTour, finishTour, active]
  );

  const popoverPosition = active && step ? getPopoverPosition(targetRect) : null;

  return (
    <AdminTourContext.Provider value={value}>
      {children}

      {active && step && popoverPosition && (
        <div className="fixed inset-0 z-[100]" role="presentation">
          {targetRect ? (
            <div
              className="pointer-events-none absolute rounded-sm ring-2 ring-sbc-gold"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 9999px rgba(16, 16, 16, 0.55)",
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-sbc-black/55" aria-hidden />
          )}

          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close tour"
            onClick={finishTour}
          />

          <div
            className="pointer-events-auto absolute z-[101] w-[min(100vw-2rem,22rem)] border border-sbc-gray-light bg-sbc-white p-5 shadow-lg"
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-tour-title"
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
              Step {stepIndex + 1} of {adminTourSteps.length}
            </p>
            <h2
              id="admin-tour-title"
              className="mt-2 text-base font-bold text-sbc-black"
            >
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-sbc-gray">
              {step.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={finishTour}
                className="cursor-pointer text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-gold"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={stepIndex === 0}
                  onClick={() => goToStep(stepIndex - 1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (isLastStep) {
                      finishTour();
                      return;
                    }
                    goToStep(stepIndex + 1);
                  }}
                >
                  {isLastStep ? "Done" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminTourContext.Provider>
  );
}

export function AdminGuideButton() {
  const { startTour } = useAdminTour();

  return (
    <button
      type="button"
      data-admin-tour="guide-button"
      onClick={startTour}
      className="cursor-pointer text-xs font-medium uppercase tracking-widest text-sbc-gray transition-colors hover:text-sbc-gold"
    >
      Guide
    </button>
  );
}

export function AdminTourBanner() {
  const { startTour, active } = useAdminTour();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (hasCompletedAdminTour() || hasDismissedAdminTourPrompt()) return;
    setShowPrompt(true);
  }, []);

  if (!showPrompt || active) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
          New here?
        </p>
        <p className="mt-1 text-sm font-semibold text-sbc-black">
          Take a quick tour of payroll and admin tools.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={startTour}>
          Start tour
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            dismissAdminTourPrompt();
            setShowPrompt(false);
          }}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
