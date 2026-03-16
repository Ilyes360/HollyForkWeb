import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min par défaut
      gcTime: 10 * 60 * 1000, // garbage collect après 10 min
      refetchOnWindowFocus: false, // éviter les refetch intempestifs en dev
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
})
