export type MyPermissionsResponse = {
  user: { id: number; username: string }
  employe: { id: number; nom: string; prenom: string }
  role: string | null
  permissions: string[]
  restaurants: Array<{ id: number; nom: string }>
  permissionCount: number
  restaurantCount: number
}
