// Rôles employé — sous-ensemble pertinent pour le register
// Les IDs doivent correspondre aux PKs du backend (valider contre le seed/DB)
export const REGISTER_EMPLOYEE_TYPES = [
  { id: 2, label: "Admin Établissement" },
  { id: 3, label: "Directeur" },
  { id: 4, label: "Manager Salle" },
  { id: 5, label: "Manager Cuisine" },
  { id: 8, label: "Serveur" },
  { id: 9, label: "Barman" },
  { id: 6, label: "Chef de rang" },
  { id: 10, label: "Personne de Caisse" },
] as const

// Types de cuisine — réutilisés depuis l'onboarding existant
export const CUISINE_TYPES = [
  { value: "francaise", label: "Française", icon: "🇫🇷" },
  { value: "italienne", label: "Italienne", icon: "🇮🇹" },
  { value: "japonaise", label: "Japonaise", icon: "🇯🇵" },
  { value: "mediterraneenne", label: "Méditerranéenne", icon: "🌿" },
  { value: "asiatique", label: "Asiatique", icon: "🥢" },
  { value: "bistrot", label: "Bistrot / Brasserie", icon: "🍷" },
  { value: "street-food", label: "Street food", icon: "🌮" },
  { value: "gastronomique", label: "Gastronomique", icon: "⭐" },
  { value: "autre", label: "Autre", icon: "🍴" },
] as const
