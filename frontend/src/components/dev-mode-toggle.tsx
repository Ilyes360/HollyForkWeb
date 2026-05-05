import { useDevModeStore, applyDevModeTransition } from "@/stores/dev-mode-store"

export function DevModeToggle() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const toggle = useDevModeStore((s) => s.toggle)

  const handleToggle = () => {
    const next = !isDevMode
    toggle()
    applyDevModeTransition(next)
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed right-4 bottom-4 z-[9999] flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-colors"
      style={{
        backgroundColor: isDevMode
          ? "hsl(45 93% 47% / 0.15)"
          : "hsl(220 14% 96% / 0.9)",
        borderColor: isDevMode ? "hsl(45 93% 47% / 0.4)" : "hsl(220 13% 91%)",
        color: isDevMode ? "hsl(45 93% 30%)" : "hsl(220 9% 46%)",
      }}
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{
          backgroundColor: isDevMode ? "hsl(45 93% 47%)" : "hsl(142 71% 45%)",
        }}
      />
      {isDevMode ? "Mode Dev" : "Mode User"}
    </button>
  )
}
