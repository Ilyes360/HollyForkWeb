import { useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

type PinPadProps = {
  length: 4 | 6
  value: string
  onChange: (value: string) => void
  onComplete: (value: string) => void
  error?: string
  disabled?: boolean
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "delete"],
] as const

export function PinPad({
  length,
  value,
  onChange,
  onComplete,
  error,
  disabled,
}: PinPadProps) {
  const handlePress = useCallback(
    (key: string) => {
      if (disabled) return

      if (key === "delete") {
        onChange(value.slice(0, -1))
        return
      }

      if (value.length >= length) return

      const next = value + key
      onChange(next)
      if (next.length === length) {
        onComplete(next)
      }
    },
    [disabled, value, length, onChange, onComplete]
  )

  return (
    <motion.div
      key={error ?? ""}
      className="flex flex-col items-center gap-8"
      animate={error ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : undefined}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Dot indicators */}
      <div className="flex gap-3" aria-live="polite" role="status">
        <span className="sr-only">
          {value.length} chiffre{value.length !== 1 ? "s" : ""} saisi
          {value.length !== 1 ? "s" : ""} sur {length}
        </span>
        {Array.from({ length }, (_, i) => (
          <motion.div
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 transition-colors duration-150",
              i < value.length
                ? error
                  ? "border-destructive bg-destructive"
                  : "border-primary bg-primary"
                : "border-muted-foreground/30 bg-transparent"
            )}
            animate={
              i === value.length - 1 && i < length
                ? { scale: [1, 1.3, 1] }
                : undefined
            }
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-sm font-medium text-destructive"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.flat().map((key, i) => {
          if (key === "") {
            return <div key={i} />
          }

          if (key === "delete") {
            return (
              <button
                key={i}
                type="button"
                aria-label="Supprimer"
                disabled={disabled || value.length === 0}
                onClick={() => handlePress("delete")}
                className="flex size-16 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80 disabled:opacity-30"
              >
                <HugeiconsIcon icon={Delete02Icon} size={24} />
              </button>
            )
          }

          return (
            <button
              key={i}
              type="button"
              aria-label={key}
              disabled={disabled}
              onClick={() => handlePress(key)}
              className="flex size-16 items-center justify-center rounded-2xl text-2xl font-semibold transition-colors hover:bg-muted active:bg-muted/80 disabled:opacity-50"
            >
              {key}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
