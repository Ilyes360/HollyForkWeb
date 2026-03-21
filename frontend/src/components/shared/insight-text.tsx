import type { CopyInsight, CopyVariant } from "@/lib/copy/types"
import { cn } from "@/lib/utils"

const VARIANT_CLASSES: Record<CopyVariant, string> = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  neutral: "text-muted-foreground",
}

interface InsightTextProps {
  insight: CopyInsight | null
  className?: string
}

export function InsightText({ insight, className }: InsightTextProps) {
  if (!insight) return null

  return (
    <p className={cn("text-xs", VARIANT_CLASSES[insight.variant], className)}>
      {insight.text}
    </p>
  )
}
