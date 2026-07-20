import { useState, useCallback } from "react"
import { AnimatePresence } from "motion/react"

import type { DeviceLoginResponse, RestaurantEmployee } from "@/api/auth/types"
import { clearDeviceToken } from "@/api/client"
import { AuthImagePanel } from "@/components/shared/auth-image-panel"
import { ThemeSwitch } from "@/components/layout/header/theme-switch"
import { usePageTitle } from "@/hooks/use-page-title"

import { DeviceSetupStep } from "./device-login/device-setup-step"
import { EmployeeSelectStep } from "./device-login/employee-select-step"
import { PinLoginStep } from "./device-login/pin-login-step"

type Step = 0 | 1 | 2

type DeviceState = {
  deviceToken: string
  restaurantName: string
}

export default function DeviceLoginPage() {
  usePageTitle("Connexion tablette")

  const [step, setStep] = useState<Step>(0)
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null)
  const [selectedEmployee, setSelectedEmployee] =
    useState<RestaurantEmployee | null>(null)

  const handleDeviceSuccess = useCallback((response: DeviceLoginResponse) => {
    setDeviceState({
      deviceToken: response.deviceToken,
      restaurantName: response.restaurantName,
    })
    setStep(1)
  }, [])

  const handleEmployeeSelect = useCallback((employee: RestaurantEmployee) => {
    setSelectedEmployee(employee)
    setStep(2)
  }, [])

  const handleBackToSetup = useCallback(() => {
    clearDeviceToken()
    setDeviceState(null)
    setSelectedEmployee(null)
    setStep(0)
  }, [])

  const handleBackToEmployees = useCallback(() => {
    setSelectedEmployee(null)
    setStep(1)
  }, [])

  return (
    <div className="relative flex h-svh overflow-hidden bg-muted/40 p-4">
      <AuthImagePanel />

      <div className="relative flex w-full items-center justify-center lg:w-1/2">
        <div className="absolute top-4 right-4 z-20">
          <ThemeSwitch />
        </div>
        <div className="absolute top-4 left-6 flex items-center gap-2 lg:hidden">
          <img src="/holyfork-logo.svg" alt="Holy Fork" className="h-8" />
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <DeviceSetupStep key="step-0" onSuccess={handleDeviceSuccess} />
          )}
          {step === 1 && deviceState && (
            <EmployeeSelectStep
              key="step-1"
              deviceToken={deviceState.deviceToken}
              restaurantName={deviceState.restaurantName}
              onSelect={handleEmployeeSelect}
              onBack={handleBackToSetup}
            />
          )}
          {step === 2 && deviceState && selectedEmployee && (
            <PinLoginStep
              key="step-2"
              deviceToken={deviceState.deviceToken}
              employee={selectedEmployee}
              onBack={handleBackToEmployees}
              onSessionExpired={handleBackToSetup}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
