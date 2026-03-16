import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../client"
import type { MyPermissionsResponse } from "./types"

export const permissionKeys = {
  all: ["permissions"] as const,
  me: () => [...permissionKeys.all, "me"] as const,
}

export function useMyPermissions(enabled = true) {
  return useQuery({
    queryKey: permissionKeys.me(),
    queryFn: () => apiGet<MyPermissionsResponse>("staff/permissions/me/"),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 min
    retry: false,
  })
}
