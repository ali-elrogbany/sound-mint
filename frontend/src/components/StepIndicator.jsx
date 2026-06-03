const STEPS = [
  { n: 1, label: 'Upload' },
  { n: 2, label: 'Analyzing' },
  { n: 3, label: 'Preview' },
  { n: 4, label: 'Mint' },
  { n: 5, label: 'Done ✓' },
]

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full select-none">
      {STEPS.map((step, i) => {
        const done = currentStep > step.n
        const active = currentStep === step.n
        return (
          <div key={step.n} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${done   ? 'bg-success text-bg shadow-glow-success' : ''}
                  ${active ? 'bg-primary text-white shadow-glow-primary ring-2 ring-primary/40' : ''}
                  ${!done && !active ? 'bg-surface border border-white/10 text-muted' : ''}
                `}
              >
                {done ? '✓' : step.n}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium transition-colors duration-200 whitespace-nowrap
                  ${active ? 'text-primary' : done ? 'text-success' : 'text-muted'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`
                  h-0.5 w-8 sm:w-14 mx-1 mb-4 rounded-full transition-all duration-500
                  ${currentStep > step.n ? 'bg-success' : 'bg-white/10'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
