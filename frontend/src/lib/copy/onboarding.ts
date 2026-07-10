// ── Onboarding wizard copy ──

export const ONBOARDING = {
  header: {
    title: "Configuration",
    stepOf: (current: number, total: number) => `Etape ${current} sur ${total}`,
  },

  steps: {
    welcome: "Bienvenue",
    restaurant: "Restaurant",
    salle: "Salle",
    team: "Equipe",
  },

  footer: {
    back: "Retour",
    skip: "Passer cette etape",
    start: "Commencer la configuration",
    next: "Suivant",
    finish: "Terminer",
  },

  welcome: {
    title: "Bienvenue sur Holy Fork",
    description:
      "Configure ton restaurant en quelques etapes. Tu pourras tout modifier plus tard.",
    features: [
      {
        title: "Reservations",
        description:
          "Gere tes resas, ton carnet clients et le service en temps reel.",
      },
      {
        title: "Planning",
        description:
          "Organise les services, les horaires et les conges de ta brigade.",
      },
      {
        title: "Plan de salle",
        description:
          "Configure ta salle, place tes tables et visualise l'occupation.",
      },
    ],
  },

  restaurant: {
    title: "Ton restaurant",
    description: "Les infos de base de ton etablissement",
    labels: {
      name: "Nom du restaurant",
      cuisineType: "Type de cuisine",
      capacity: "Capacite (couverts)",
      openingHours: "Horaires d'ouverture",
    },
    placeholders: {
      name: "Ex : Le Petit Bistrot",
      capacity: "Ex : 40",
      openingHours: "Ou saisis tes horaires",
    },
  },

  salle: {
    title: "Ta salle",
    description:
      "Choisis un modele de depart. Tu pourras tout personnaliser ensuite dans l'editeur.",
    scratchTitle: "Commencer de zero",
    scratchDescription: "Configure manuellement dans l'editeur",
  },

  team: {
    title: "Ta brigade",
    description:
      "Ajoute tes premiers membres. Tu pourras en ajouter d'autres plus tard.",
    columns: {
      firstName: "Prenom",
      role: "Poste",
      hours: "Heures",
    },
    addMember: "Ajouter un membre",
  },
} as const

// ── Getting started (sidebar + header) ──

export const GETTING_STARTED = {
  title: "Premiers pas",
  dismissAriaLabel: "Masquer les premiers pas",
  headerDismissAriaLabel: "Masquer le guide",
  srOnlyLabel: "Guide de demarrage",
  launchWizard: "Lancer l'assistant",
  wizardSubtitle: "Configuration guidee en 4 etapes",
  progress: (completed: number, total: number) =>
    `${completed}/${total} terminees`,
  done: "Termine !",

  tasks: {
    "restaurant-profile": {
      label: "Complete ton restaurant",
      description: "Horaires, couverts, equipe",
    },
    "floor-plan": {
      label: "Configure ta salle",
      description: "Ajoute tables et zones",
    },
    "team-member": {
      label: "Ajoute un employe",
      description: "Serveurs, cuisine, managers",
    },
    "first-service": {
      label: "Cree ton premier service",
      description: "Planifie un service midi ou soir",
    },
    "first-reservation": {
      label: "Accepte une reservation",
      description: "Cree ou accepte une resa",
    },
  },
} as const
