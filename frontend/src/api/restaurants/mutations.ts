import { useMutation } from "@tanstack/react-query"
import { apiPost } from "../client"
import type { CreateRestaurantRequest, CreateRestaurantResponse } from "./types"

export function useCreateRestaurant() {
  return useMutation({
    mutationFn: (data: CreateRestaurantRequest) =>
      apiPost<CreateRestaurantResponse>("restaurants/", data),
  })
}
