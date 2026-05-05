import { create } from "zustand"
import type { FloorPlan } from "@/components/salle/types"
import { DEFAULT_PLAN } from "@/components/salle/constants"

interface FloorPlanStore {
  plan: FloorPlan
  setPlan: (plan: FloorPlan) => void
}

export const useFloorPlanStore = create<FloorPlanStore>((set) => ({
  plan: DEFAULT_PLAN,
  setPlan: (plan) => set({ plan }),
}))
