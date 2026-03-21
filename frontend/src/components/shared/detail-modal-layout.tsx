import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useIsTablet } from "@/hooks/use-mobile"

interface DetailModalLayoutProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose: () => void
  left: React.ReactNode
  right: React.ReactNode
  footer?: React.ReactNode
}

export function DetailModalLayout({
  title,
  subtitle,
  onClose,
  left,
  right,
  footer,
}: DetailModalLayoutProps) {
  const isTablet = useIsTablet()

  return (
    <>
      {/* Header */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 ml-4">
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
        </Button>
      </div>

      {/* Body */}
      {isTablet ? (
        /* Single column on tablet/mobile */
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {left}
          {right}
        </div>
      ) : (
        /* Two columns on desktop */
        <div className="flex min-h-0 flex-1">
          <div className="w-[360px] shrink-0 overflow-y-auto border-r p-6 space-y-6">
            {left}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {right}
          </div>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="shrink-0 px-6 py-4 flex justify-end gap-2 border-t">
          {footer}
        </div>
      )}
    </>
  )
}
