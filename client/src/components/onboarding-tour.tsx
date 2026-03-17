import { MdAutoAwesome, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='sidebar']",
    title: 'Navigation Sidebar',
    description:
      'Access all FinOps modules — Dashboard, Analytics, Resources, Tenants, Budgets, Tag Governance, Waste Detection, and more. Click the collapse button to save space.',
    position: 'right',
  },
  {
    target: "[data-tour='tenant-selector']",
    title: 'Tenant Selector',
    description:
      'Filter all data by tenant/organization. Select "All Tenants" for aggregated view, or pick a specific tenant to drill into their costs and resources.',
    position: 'bottom',
  },
  {
    target: "[data-tour='date-range']",
    title: 'Date Range',
    description:
      'Change the analytics time period — Last 7 days, 30 days, 90 days, or month-based ranges. All charts, KPIs, and tables update accordingly.',
    position: 'bottom',
  },
  {
    target: "[data-tour='theme-toggle']",
    title: 'Theme Toggle',
    description:
      'Switch between light and dark mode. Your preference persists across sessions.',
    position: 'bottom',
  },
  {
    target: "[data-tour='notifications']",
    title: 'Notifications',
    description:
      'Real-time alerts for budget thresholds, cost anomalies, optimization opportunities, and savings applied. The badge shows unread count.',
    position: 'bottom',
  },
  {
    target: "[data-tour='main-content']",
    title: "You're All Set!",
    description:
      'This is your main workspace. Each module loads here with interactive charts, data tables, and actionable controls. Start exploring the Dashboard to see your cloud spend overview.',
    position: 'top',
  },
];

const STORAGE_KEY = 'hcs-finops-tour-done';

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const current = tourSteps[step];

  const dismiss = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  // Show on first visit
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Find and highlight target
  useEffect(() => {
    if (!active) return;
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    } else {
      setTargetRect(null);
    }
  }, [active, step, current.target]);

  // Position tooltip
  useEffect(() => {
    if (!targetRect || !active) return;
    const pos = current.position || 'bottom';
    const gap = 16;
    const tooltipW = 360;
    const tooltipH = 210;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = 0;
    let left = 0;

    switch (pos) {
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
        left = targetRect.right + gap;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
        left = targetRect.left - tooltipW - gap;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipH - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
        break;
    }

    top = Math.max(16, Math.min(top, vh - tooltipH - 16));
    left = Math.max(16, Math.min(left, vw - tooltipW - 16));
    setTooltipStyle({ top, left, width: tooltipW });
  }, [targetRect, current.position, active]);

  if (!active) return null;

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[9998]" onClick={dismiss}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
        </svg>
      </div>

      {/* Spotlight ring */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] bg-card border border-border rounded-lg shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <MdAutoAwesome className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{current.title}</h3>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          >
            <MdClose className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{current.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step === 0 ? (
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={dismiss}>
                Skip tour
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setStep((s) => s - 1)}>
                <MdChevronLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
            )}
            {step < tourSteps.length - 1 ? (
              <Button size="sm" className="text-xs h-8" onClick={() => setStep((s) => s + 1)}>
                Next
                <MdChevronRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" className="text-xs h-8" onClick={dismiss}>
                Get Started
              </Button>
            )}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground/60 text-center mt-3">
          {step + 1} of {tourSteps.length}
        </div>
      </div>
    </>
  );
}
