import { useState } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HTTPError } from "ky"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { useQuickLogin } from "@/api/auth/mutations"
import type { RestaurantEmployee } from "@/api/auth/types"
import { PinPad } from "@/components/ui/pin-pad"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PinLoginStepProps = {
  deviceToken: string
  employee: RestaurantEmployee
  onBack: () => void
  onSessionExpired: () => void
}

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
]

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function PinLoginStep({
  deviceToken,
  employee,
  onBack,
  onSessionExpired,
}: PinLoginStepProps) {
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const quickLoginMutation = useQuickLogin()
  const navigate = useNavigate()

  const handlePinComplete = (pinValue: string) => {
    setPinError("")
    quickLoginMutation.mutate(
      { deviceToken, pinCode: pinValue },
      {
        onSuccess: () => {
          navigate("/", { replace: true })
        },
        onError: async (err) => {
          setPin("")
          if (err instanceof HTTPError) {
            const status = err.response.status
            if (status === 401) {
              toast.error("Session expirée. Veuillez reconfigurer l'appareil.")
              onSessionExpired()
            } else if (status === 400) {
              setPinError("PIN incorrect")
            } else if (status === 429) {
              toast.error("Trop de tentatives. Veuillez patienter.")
            } else {
              toast.error("Erreur serveur, veuillez réessayer.")
            }
          } else {
            toast.error("Impossible de contacter le serveur.")
          }
        },
      }
    )
  }

  return (
    <motion.div
      key="pin-login"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className="w-full max-w-md space-y-8 px-6"
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        variants={fadeUp}
      >
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full text-2xl font-semibold",
            getAvatarColor(employee.employeeId)
          )}
        >
          {getInitials(employee.employeeFirstName, employee.employeeLastName)}
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold">
            {employee.employeeFirstName} {employee.employeeLastName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrez votre PIN pour vous connecter
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <PinPad
          length={4}
          value={pin}
          onChange={setPin}
          onComplete={handlePinComplete}
          error={pinError}
          disabled={quickLoginMutation.isPending}
        />
      </motion.div>

      <motion.div className="flex justify-center" variants={fadeUp}>
        <Button variant="ghost" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          Retour
        </Button>
      </motion.div>
    </motion.div>
  )
}
