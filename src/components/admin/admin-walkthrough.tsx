"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  adminTourSteps,
  dismissAdminTourPrompt,
  hasCompletedAdminTour,
  hasDismissedAdminTourPrompt,
  markAdminTourCompleted,
  persistTourSession,
  readTourSession,
  type AdminTourStep,
} from "@/lib/admin-walkthrough";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type WidgetMode = "closed" | "prompt" | "touring";

type AdminTourContextValue = {
  openGuide: () => void;
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

function measureVisibleTarget(selector?: string): Rect | null {
  if (!selector || typeof document === "undefined") return null;

  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) {
      return {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      };
    }
  }
  return null;
}

function pathMatchesStep(pathname: string, navigateTo?: string) {
  if (!navigateTo) return true;
  if (navigateTo === "/admin") return pathname === "/admin";
  return pathname === navigateTo || pathname.startsWith(`${navigateTo}/`);
}

function scrollTargetIntoView(selector?: string) {
  if (!selector || typeof document === "undefined") return;

  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) {
      node.scrollIntoView({ block: "nearest", behavior: "instant" });
      return;
    }
  }
}

const ADMIN_TOUR_ROUTES = [
  "/admin",
  "/admin/rates",
  "/admin/contributions",
  "/admin/employees",
  "/admin/attendance",
  "/admin/payroll",
  "/admin/projects",
  "/admin/account",
];

type ProviderProps = {
  children: React.ReactNode;
  openNav?: () => void;
};

export function AdminTourProvider({ children, openNav }: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<WidgetMode>("closed");
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);

  const step = adminTourSteps[stepIndex];
  const isLastStep = stepIndex === adminTourSteps.length - 1;
  const touring = mode === "touring";

  const finishTour = useCallback(() => {
    markAdminTourCompleted();
    persistTourSession(false, 0);
    setMode("closed");
    setStepIndex(0);
    setTargetRect(null);
    setReady(false);
  }, []);

  const startTour = useCallback(() => {
    dismissAdminTourPrompt();
    persistTourSession(true, 0);
    setStepIndex(0);
    setMode("touring");
    setReady(true);

    for (const route of ADMIN_TOUR_ROUTES) {
      router.prefetch(route);
    }

    const first = adminTourSteps[0];
    if (first.navigateTo && !pathMatchesStep(pathname, first.navigateTo)) {
      router.push(first.navigateTo);
    }
  }, [pathname, router]);

  const openGuide = useCallback(() => {
    dismissAdminTourPrompt();
    setMode("prompt");
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const nextStep = adminTourSteps[index];
      if (!nextStep) return;

      persistTourSession(true, index);
      setStepIndex(index);

      if (nextStep.navigateTo && !pathMatchesStep(pathname, nextStep.navigateTo)) {
        setReady(false);
        router.push(nextStep.navigateTo);
        return;
      }

      setReady(true);
    },
    [pathname, router]
  );

  useEffect(() => {
    const session = readTourSession();
    if (session.active) {
      setMode("touring");
      setStepIndex(session.stepIndex);
    }

    for (const route of ADMIN_TOUR_ROUTES) {
      router.prefetch(route);
    }
  }, [router]);

  useEffect(() => {
    if (!touring || !step) return;

    if (window.matchMedia("(max-width: 767px)").matches && step.target) {
      openNav?.();
    }

    if (!pathMatchesStep(pathname, step.navigateTo)) {
      setReady(false);
      setTargetRect(null);
      return;
    }

    setReady(true);

    if (!step.target) {
      setTargetRect(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const syncTarget = () => {
      if (cancelled) return;

      scrollTargetIntoView(step.target);

      const rect = measureVisibleTarget(step.target);
      if (rect) {
        setTargetRect(rect);
        return;
      }

      attempts += 1;
      if (attempts < 12) {
        window.setTimeout(syncTarget, 40);
      }
    };

    syncTarget();

    return () => {
      cancelled = true;
    };
  }, [touring, step, pathname, openNav]);

  useEffect(() => {
    if (!touring) return;

    function refreshSpotlight() {
      if (!step?.target) return;
      setTargetRect(measureVisibleTarget(step.target));
    }

    window.addEventListener("resize", refreshSpotlight);
    window.addEventListener("scroll", refreshSpotlight, true);

    return () => {
      window.removeEventListener("resize", refreshSpotlight);
      window.removeEventListener("scroll", refreshSpotlight, true);
    };
  }, [touring, step]);

  useEffect(() => {
    if (readTourSession().active) return;
    if (hasCompletedAdminTour() || hasDismissedAdminTourPrompt()) return;
    const timer = window.setTimeout(() => setMode("prompt"), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo(
    () => ({
      openGuide,
      startTour,
      finishTour,
      active: touring,
    }),
    [openGuide, startTour, finishTour, touring]
  );

  return (
    <AdminTourContext.Provider value={value}>
      {children}

      {touring && targetRect && (
        <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden>
          <div
            className="absolute rounded-sm ring-2 ring-sbc-gold transition-all duration-150"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              boxShadow: "0 0 0 9999px rgba(16, 16, 16, 0.45)",
            }}
          />
        </div>
      )}

      <AdminGuideWidget
        mode={mode}
        setMode={setMode}
        step={step}
        stepIndex={stepIndex}
        isLastStep={isLastStep}
        ready={ready}
        onStart={startTour}
        onFinish={finishTour}
        onBack={() => goToStep(stepIndex - 1)}
        onNext={() => {
          if (isLastStep) {
            finishTour();
            return;
          }
          goToStep(stepIndex + 1);
        }}
      />
    </AdminTourContext.Provider>
  );
}

function AdminGuideWidget({
  mode,
  setMode,
  step,
  stepIndex,
  isLastStep,
  ready,
  onStart,
  onFinish,
  onBack,
  onNext,
}: {
  mode: WidgetMode;
  setMode: (mode: WidgetMode) => void;
  step: AdminTourStep | undefined;
  stepIndex: number;
  isLastStep: boolean;
  ready: boolean;
  onStart: () => void;
  onFinish: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  if (mode === "closed") {
    return (
      <button
        type="button"
        onClick={() => setMode("prompt")}
        className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-sbc-gold bg-sbc-white shadow-lg transition-transform hover:scale-105"
        aria-label="Open admin guide"
      >
        <Image src="/brand/logo-sbc.png" alt="" width={32} height={32} />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] flex w-full flex-col border-t border-sbc-gray-light bg-sbc-white shadow-[0_-8px_32px_rgba(0,0,0,0.12)] sm:bottom-5 sm:right-5 sm:w-[min(100vw-2rem,26rem)] sm:rounded-sm sm:border"
      role="dialog"
      aria-labelledby="admin-guide-title"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 border-b border-sbc-gray-light px-4 py-3">
        <Image
          src="/brand/logo-sbc.png"
          alt=""
          width={28}
          height={28}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gold">
            Admin guide
          </p>
          <p id="admin-guide-title" className="truncate text-sm font-bold text-sbc-black">
            {mode === "prompt" ? "Need a hand?" : step?.title ?? "Guide"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (mode === "touring") onFinish();
            else {
              dismissAdminTourPrompt();
              setMode("closed");
            }
          }}
          className="cursor-pointer px-2 py-1 text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-gold"
          aria-label="Close guide"
        >
          Close
        </button>
      </div>

      {mode === "prompt" && (
        <div className="px-4 py-4">
          <p className="text-sm leading-relaxed text-sbc-gray">
            Would you like a guided walkthrough of payroll and admin tools? We&apos;ll
            step through each section in order — you can skip anytime.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onStart}>
              Yes, guide me
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                dismissAdminTourPrompt();
                setMode("closed");
              }}
            >
              Maybe later
            </Button>
          </div>
        </div>
      )}

      {mode === "touring" && step && (
        <>
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
                Step {stepIndex + 1} of {adminTourSteps.length}
              </p>
              <div className="flex gap-1">
                {adminTourSteps.map((item, index) => (
                  <span
                    key={item.id}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === stepIndex
                        ? "bg-sbc-gold"
                        : index < stepIndex
                          ? "bg-sbc-gold/40"
                          : "bg-sbc-gray-light"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-sbc-gray">{step.description}</p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-sbc-gray-light px-4 py-3">
            <button
              type="button"
              onClick={onFinish}
              className="cursor-pointer text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-gold"
            >
              End tour
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={stepIndex === 0}
                onClick={onBack}
              >
                Back
              </Button>
              <Button type="button" size="sm" disabled={!ready} onClick={onNext}>
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminGuideButton() {
  const { openGuide } = useAdminTour();

  return (
    <button
      type="button"
      onClick={openGuide}
      className="cursor-pointer text-xs font-medium uppercase tracking-widest text-sbc-gray transition-colors hover:text-sbc-gold"
    >
      Guide
    </button>
  );
}
