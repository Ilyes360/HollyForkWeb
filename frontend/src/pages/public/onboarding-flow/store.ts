import { create } from "zustand"
import type { LocationData } from "@/types/location"

export interface RestaurantInfo {
  name: string
  cuisineType: string
  city: string
  location: LocationData | null
}

export interface EstablishmentInfo {
  covers: string
  teamSize: string
}

export interface OnboardingData {
  restaurant: RestaurantInfo
  plan: string
  establishment: EstablishmentInfo
  modules: string[]
}

interface OnboardingStore {
  currentStep: number
  totalSteps: number
  direction: number
  data: OnboardingData
  setCurrentStep: (step: number) => void
  updateRestaurant: (info: Partial<RestaurantInfo>) => void
  updatePlan: (plan: string) => void
  updateEstablishment: (info: Partial<EstablishmentInfo>) => void
  updateModules: (modules: string[]) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  reset: () => void
  hydrateFromSession: () => boolean
}

const initialData: OnboardingData = {
  restaurant: {
    name: "",
    cuisineType: "",
    city: "",
    location: null,
  },
  plan: "",
  establishment: {
    covers: "",
    teamSize: "",
  },
  modules: [],
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  currentStep: 0,
  totalSteps: 5,
  direction: 1,
  data: initialData,
  setCurrentStep: (step) => set({ currentStep: step }),
  updateRestaurant: (info) =>
    set((state) => ({
      data: {
        ...state.data,
        restaurant: { ...state.data.restaurant, ...info },
      },
    })),
  updatePlan: (plan) =>
    set((state) => ({
      data: { ...state.data, plan },
    })),
  updateEstablishment: (info) =>
    set((state) => ({
      data: {
        ...state.data,
        establishment: { ...state.data.establishment, ...info },
      },
    })),
  updateModules: (modules) =>
    set((state) => ({
      data: { ...state.data, modules },
    })),
  nextStep: () =>
    set((state) => ({ currentStep: Math.min(state.totalSteps - 1, state.currentStep + 1), direction: 1 })),
  prevStep: () =>
    set((state) => ({ currentStep: Math.max(0, state.currentStep - 1), direction: -1 })),
  goToStep: (step) =>
    set((state) => ({
      currentStep: step,
      direction: step < state.currentStep ? -1 : 1,
    })),
  reset: () => set({ currentStep: 0, direction: 1, data: initialData }),
  hydrateFromSession: () => {
    const pending = sessionStorage.getItem("holly_pending_restaurant")
    if (!pending) return false
    try {
      const data = JSON.parse(pending)
      set((state) => ({
        data: {
          ...state.data,
          restaurant: {
            ...state.data.restaurant,
            name: data.restaurantName ?? "",
            cuisineType: data.cuisineType ?? "",
            city: data.city ?? "",
          },
          establishment: {
            covers: data.covers ?? "",
            teamSize: data.teamSize ?? "",
          },
        },
      }))
      return true
    } catch {
      return false
    }
  },
}))
