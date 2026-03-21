import { useEffect } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 }

interface FullscreenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  zIndex?: number
}

export function FullscreenModal({
  open,
  onOpenChange,
  children,
  className,
  zIndex = 60,
}: FullscreenModalProps) {
  const isMobile = useIsMobile()

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Panel */}
          <motion.div
            className={cn(
              "fixed flex flex-col overflow-hidden bg-background shadow-2xl",
              isMobile
                ? "inset-2 rounded-xl"
                : "inset-y-6 inset-x-10 rounded-2xl",
              className
            )}
            style={{ zIndex: zIndex + 1 }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={SPRING}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
