import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"

// ── Types matching backend responses (after camelizeKeys) ──

export type ApiRole = {
  name: string
  value: string
  hierarchyLevel: number
}

type ApiHierarchyItem = {
  level: number
  role: string
  permissionsCount: number
}

type ApiHierarchyResponse = {
  hierarchy: ApiHierarchyItem[]
  totalLevels: number
}

type ApiMatrixResponse = {
  matrix: Record<string, string[]>
  rolesCount: number
  totalPermissions: number
}

export type RoleWithPermissions = {
  name: string
  level: number
  permissionsCount: number
  permissions: string[]
}

// ── Keys ──

const keys = {
  all: ["roles"] as const,
  list: () => [...keys.all, "list"] as const,
  hierarchy: () => [...keys.all, "hierarchy"] as const,
  matrix: () => [...keys.all, "matrix"] as const,
}

// ── Hooks ──

/**
 * List all roles (flat list with name/value/hierarchyLevel).
 * Uses GET /api/staff/permissions/roles/
 */
export function useRoles() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = await apiGet<{ roles: ApiRole[]; count: number }>(
        "staff/permissions/roles/"
      )
      return res.roles
    },
    enabled: hasToken,
    staleTime: 10 * 60_000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/**
 * Role hierarchy + permissions matrix combined.
 * Returns roles sorted by level with their permissions array.
 */
export function useRoleHierarchy() {
  const hasToken = !!getAccessToken()

  const hierarchyQuery = useQuery({
    queryKey: keys.hierarchy(),
    queryFn: () => apiGet<ApiHierarchyResponse>("staff/permissions/hierarchy/"),
    enabled: hasToken,
    staleTime: 10 * 60_000,
  })

  const matrixQuery = useQuery({
    queryKey: keys.matrix(),
    queryFn: () => apiGet<ApiMatrixResponse>("staff/permissions/matrix/"),
    enabled: hasToken,
    staleTime: 10 * 60_000,
  })

  const roles = useMemo<RoleWithPermissions[]>(() => {
    if (!hierarchyQuery.data?.hierarchy) return []
    const matrix = matrixQuery.data?.matrix ?? {}

    return hierarchyQuery.data.hierarchy
      .slice()
      .sort((a, b) => a.level - b.level)
      .map((item) => ({
        name: item.role,
        level: item.level,
        permissionsCount: item.permissionsCount,
        permissions: matrix[item.role] ?? [],
      }))
  }, [hierarchyQuery.data, matrixQuery.data])

  return {
    data: roles,
    totalPermissions: matrixQuery.data?.totalPermissions ?? 0,
    isLoading: hierarchyQuery.isLoading || matrixQuery.isLoading,
    isError: hierarchyQuery.isError || matrixQuery.isError,
  }
}
