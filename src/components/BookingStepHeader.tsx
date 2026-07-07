"use client";

import { X } from "lucide-react";

interface Step {
  id: string;
  label: string;
  number: number;
}

interface BookingStepHeaderProps {
  steps: Step[];
  currentStep: string;
  barberName: string;
  onClose: () => void;
}

const BookingStepHeader = ({ steps, currentStep, barberName, onClose }: BookingStepHeaderProps) => {
  const currentStepNumber = steps.find(s => s.id === currentStep)?.number || 1;

  return (
    <div className="bg-cut-black border-b border-cut-bronze/20 flex-shrink-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cut-burgundy/40 border border-cut-bronze/25 flex items-center justify-center">
            <span className="text-cut-bronze font-bold text-sm">✂</span>
          </div>
          <span className="text-cut-warm-beige font-heading font-bold text-lg">
            احجز مع {barberName}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-cut-espresso hover:bg-cut-wine-black flex items-center justify-center transition-colors group border border-cut-bronze/15"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-cut-ivory/60 group-hover:text-cut-ivory transition-colors" />
        </button>
      </div>

      <div className="hidden md:flex items-center gap-1 px-6 pb-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.number < currentStepNumber;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isActive ? "bg-cut-ivory text-cut-black shadow-cut-glow" : ""}
                    ${isCompleted ? "bg-cut-bronze text-cut-black" : ""}
                    ${!isActive && !isCompleted ? "bg-cut-espresso text-cut-ivory/40 border border-cut-bronze/15" : ""}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive ? "text-cut-ivory" : ""}
                    ${isCompleted ? "text-cut-ivory/70" : ""}
                    ${!isActive && !isCompleted ? "text-cut-ivory/35" : ""}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-3 h-px w-8 bg-cut-bronze/20" />
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-cut-ivory/50 text-xs">
            {currentStepNumber} / {steps.length}
          </span>
          <span className="text-cut-ivory font-medium text-sm">
            {steps.find(s => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="h-0.5 bg-cut-espresso rounded-full overflow-hidden">
          <div
            className="h-full bg-cut-bronze transition-all duration-500 ease-out"
            style={{ width: `${(currentStepNumber / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingStepHeader;
