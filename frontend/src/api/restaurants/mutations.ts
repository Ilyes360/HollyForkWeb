import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiPost } from "../client"
import type { CreateRestaurantRequest, CreateRestaurantResponse } from "./types"

export function useCreateRestaurant() {
  return useMutationWithDefaults({
    mutationFn: (data: CreateRestaurantRequest) =>
      apiPost<CreateRestaurantResponse>("restaurants/", data),
  })
}
