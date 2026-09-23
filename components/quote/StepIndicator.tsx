import { Check } from "lucide-react";

export interface StepDef {
  key: string;
  label: string;
}

export function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: StepDef[];
  currentIndex: number;
}) {
  return (
    <div>
      {/* Mobile: compact progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-medium text-ink-500">
          <span>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-brand-700">{steps[currentIndex].label}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step list */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isComplete
                      ? "bg-brand-600 text-white"
                      : isCurrent
                      ? "border-2 border-brand-600 text-brand-700"
                      : "border-2 border-ink-200 text-ink-400",
                  ].join(" ")}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={[
                    "text-sm font-medium whitespace-nowrap",
                    isCurrent ? "text-ink-900" : "text-ink-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={[
                    "mx-4 h-px flex-1",
                    isComplete ? "bg-brand-600" : "bg-ink-200",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
