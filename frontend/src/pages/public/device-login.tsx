import { useState, useCallback } from "react"
import { AnimatePresence } from "motion/react"

import type { DeviceLoginResponse, RestaurantEmployee } from "@/api/auth/types"
import {
  clearDeviceToken,
  getDeviceToken,
  getDeviceRestaurantName,
} from "@/api/client"
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

function getInitialState(): { step: Step; deviceState: DeviceState | null } {
  const savedToken = getDeviceToken()
  const savedName = getDeviceRestaurantName()
  if (savedToken && savedName) {
    return {
      step: 1,
      deviceState: { deviceToken: savedToken, restaurantName: savedName },
    }
  }
  return { step: 0, deviceState: null }
}

export default function DeviceLoginPage() {
  usePageTitle("Connexion tablette")

  const initial = getInitialState()
  const [step, setStep] = useState<Step>(initial.step)
  const [deviceState, setDeviceState] = useState<DeviceState | null>(
    initial.deviceState
  )
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

      <div className="relative flex w-full justify-center overflow-y-auto pt-16 lg:w-1/2">
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
