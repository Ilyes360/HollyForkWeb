# API Integration — Quickstart

## Structure

```
src/api/
├── client.ts           # ky instance + apiGet/apiPost/apiPut/apiPatch/apiDelete
├── query-client.ts     # QueryClient (à brancher dans main.tsx)
├── types.ts            # PaginatedResponse<T>, ApiError, ListParams
├── case-transform.ts   # snake_case ↔ camelCase (automatique)
└── [domaine]/
    ├── types.ts        # Types requête/réponse
    ├── queries.ts      # useXxx() — hooks de lecture
    ├── mutations.ts    # useCreateXxx(), useUpdateXxx() — hooks d'écriture
    └── index.ts        # Barrel export
```

## Flux back → composant

```
apiGet("reservations/")  →  ky.get + Bearer auto  →  camelizeKeys  →  TanStack cache  →  composant
```

## Ajouter un nouveau domaine (template)

```typescript
// api/reservations/types.ts
export type Reservation = { id: number; nomClient: string; ... }

// api/reservations/queries.ts
export const reservationKeys = {
  all: ["reservations"] as const,
  list: (params?: ListParams) => [...reservationKeys.all, "list", params] as const,
  detail: (id: number) => [...reservationKeys.all, "detail", id] as const,
}
export function useReservations(params?: ListParams) {
  return useQuery({
    queryKey: reservationKeys.list(params),
    queryFn: () => apiGet<PaginatedResponse<Reservation>>("reservations/", {
      searchParams: params,
    }),
  })
}

// api/reservations/mutations.ts
export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReservationRequest) =>
      apiPost<Reservation>("reservations/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  })
}
```

## Branchement (à faire une seule fois)

```tsx
// main.tsx — ajouter QueryClientProvider
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/api/query-client"

<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

## Auth — hooks disponibles

| Hook | Usage |
|------|-------|
| `useLogin()` | `.mutate({ email, password })` |
| `useLogout()` | `.mutate()` |
| `useRegister()` | `.mutate({ email, password, ... })` |
| `useVerifyMfa()` | `.mutate({ tempToken, code })` |
| `useProfile()` | Query auto du profil connecté |
| `useMfaSetup()` | `.mutate()` → `{ secret, otpauthUrl }` |
| `useMfaConfirm()` | `.mutate(code)` |
| `useMfaDisable()` | `.mutate(password)` |
| `useDeleteAccount()` | `.mutate()` |

## Commandes utiles

```bash
pnpm dev                    # Dev avec proxy /api → localhost:8000
pnpm typecheck              # Vérifier les types sans build
```
