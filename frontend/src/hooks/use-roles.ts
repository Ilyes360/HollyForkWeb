import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"

type ApiRole = {
  id: number
  name: string
  description: string
  permissions: string[]
}

const keys = {
  all: ["roles"] as const,
  list: () => [...keys.all, "list"] as const,
}

/**
 * List all roles.
 */
export function useRoles() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = await apiGet<{ roles: ApiRole[] }>("staff/roles/all/")
      return res.roles
    },
    enabled: hasToken,
    staleTime: 10 * 60 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
