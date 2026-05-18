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
    <div className="bg-[#0a0a0a] border-b border-[#D4AF37]/20 flex-shrink-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center">
            <span className="text-[#D4AF37] font-bold text-sm">✂</span>
          </div>
          <span className="text-[#D4AF37] font-heading font-bold text-lg">
            احجز مع {barberName}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Step indicators - Desktop */}
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
                    ${isActive ? "bg-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.5)]" : ""}
                    ${isCompleted ? "bg-[#D4AF37]/70 text-black" : ""}
                    ${!isActive && !isCompleted ? "bg-white/10 text-white/40" : ""}
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
                    ${isActive ? "text-white" : ""}
                    ${isCompleted ? "text-white/70" : ""}
                    ${!isActive && !isCompleted ? "text-white/35" : ""}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-3 h-px w-8 bg-white/15" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs">
            {currentStepNumber} / {steps.length}
          </span>
          <span className="text-white font-medium text-sm">
            {steps.find(s => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4AF37] transition-all duration-500 ease-out"
            style={{ width: `${(currentStepNumber / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingStepHeader;
