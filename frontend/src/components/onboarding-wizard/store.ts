import { create } from "zustand"

export interface TeamMember {
  firstName: string
  role: string
  contractHours: string
}

export interface WizardData {
  restaurantName: string
  cuisineType: string
  capacity: string
  openingHours: string
  salleTemplate: "small" | "medium" | "large" | "scratch" | ""
  teamMembers: TeamMember[]
}

const INITIAL_DATA: WizardData = {
  restaurantName: "",
  cuisineType: "",
  capacity: "",
  openingHours: "",
  salleTemplate: "",
  teamMembers: [
    { firstName: "", role: "", contractHours: "" },
    { firstName: "", role: "", contractHours: "" },
  ],
}

interface OnboardingWizardStore {
  currentStep: number
  direction: number
  data: WizardData

  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void

  updateRestaurant: (patch: Partial<Pick<WizardData, "restaurantName" | "cuisineType" | "capacity" | "openingHours">>) => void
  setSalleTemplate: (t: WizardData["salleTemplate"]) => void
  updateTeamMember: (index: number, patch: Partial<TeamMember>) => void
  addTeamMember: () => void
  removeTeamMember: (index: number) => void

  reset: () => void
}

export const useWizardStore = create<OnboardingWizardStore>((set) => ({
  currentStep: 0,
  direction: 1,
  data: { ...INITIAL_DATA, teamMembers: INITIAL_DATA.teamMembers.map((m) => ({ ...m })) },

  nextStep: () =>
    set((s) => ({ currentStep: Math.min(3, s.currentStep + 1), direction: 1 })),
  prevStep: () =>
    set((s) => ({ currentStep: Math.max(0, s.currentStep - 1), direction: -1 })),
  goToStep: (step) =>
    set((s) => ({ currentStep: step, direction: step > s.currentStep ? 1 : -1 })),

  updateRestaurant: (patch) =>
    set((s) => ({ data: { ...s.data, ...patch } })),
  setSalleTemplate: (t) =>
    set((s) => ({ data: { ...s.data, salleTemplate: t } })),
  updateTeamMember: (index, patch) =>
    set((s) => ({
      data: {
        ...s.data,
        teamMembers: s.data.teamMembers.map((m, i) =>
          i === index ? { ...m, ...patch } : m
        ),
      },
    })),
  addTeamMember: () =>
    set((s) => ({
      data: {
        ...s.data,
        teamMembers: [...s.data.teamMembers, { firstName: "", role: "", contractHours: "" }],
      },
    })),
  removeTeamMember: (index) =>
    set((s) => ({
      data: {
        ...s.data,
        teamMembers: s.data.teamMembers.filter((_, i) => i !== index),
      },
    })),

  reset: () =>
    set({
      currentStep: 0,
      direction: 1,
      data: { ...INITIAL_DATA, teamMembers: INITIAL_DATA.teamMembers.map((m) => ({ ...m })) },
    }),
}))
