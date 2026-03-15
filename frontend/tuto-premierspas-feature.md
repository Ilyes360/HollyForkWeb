# Getting Started — Guide d'implémentation

## Architecture

Le système "Getting Started" guide les nouveaux utilisateurs à travers les premières actions essentielles après l'onboarding. Il se compose de 3 éléments :

```
src/
├── stores/getting-started-store.ts    # État persisté (zustand + localStorage)
├── components/layout/sidebar/
│   └── getting-started.tsx            # Checklist dans la sidebar
└── (pages)                            # Chaque page peut compléter une tâche
```

## Principes

1. **Pas de blocage** — La checklist guide, elle ne bloque jamais l'accès à une fonctionnalité
2. **Détection automatique** — Les tâches se complètent quand l'utilisateur fait l'action, pas quand il coche une case
3. **Dismissable** — L'utilisateur peut masquer la checklist à tout moment
4. **Persisté** — L'état est stocké en `localStorage` (clé : `holly-fork-getting-started`)

## Comment ajouter une tâche

### 1. Déclarer la tâche dans le store

Dans `src/stores/getting-started-store.ts`, ajouter un objet dans `initialTasks` :

```ts
{
  id: "unique-task-id",        // Identifiant unique, kebab-case
  label: "Libellé court",      // Max ~30 caractères, affiché dans la sidebar
  description: "Description",  // Contexte, non affiché pour le moment (réservé)
  to: "/page-cible",           // Route vers laquelle le lien pointe
  completed: false,            // false par défaut
}
```

**Règles :**
- Max 6 tâches au total (au-delà la sidebar déborde)
- L'ordre dans le tableau = l'ordre d'affichage
- La première tâche (`restaurant-profile`) est `completed: true` car faite à l'onboarding

### 2. Déclencher la complétion depuis une page

Dans le composant/page concerné, appeler `completeTask` quand l'utilisateur a effectué l'action :

```tsx
import { useGettingStartedStore } from "@/stores/getting-started-store"

function MyPage() {
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const handleSave = () => {
    // ... logique de sauvegarde
    completeTask("unique-task-id")
  }
}
```

**Quand déclencher :**
- Après une action concrète et persistée (sauvegarde, création, confirmation)
- Jamais sur un simple affichage de page ou clic de navigation
- Exemples :
  - `floor-plan` → quand l'utilisateur sauvegarde un plan de salle avec au moins 1 table
  - `team-member` → quand un employé est créé avec succès
  - `first-service` → quand un service est planifié
  - `first-reservation` → quand une réservation est créée ou confirmée

### 3. Tâches actuelles

| ID | Label | Déclencheur attendu | Page |
|----|-------|---------------------|------|
| `restaurant-profile` | Complétez votre restaurant | Onboarding (pré-complété) | `/settings` |
| `floor-plan` | Configurez votre salle | Sauvegarde d'un plan avec ≥1 table | `/salle` |
| `team-member` | Ajoutez un employé | Création d'un employé | `/admin` |
| `first-service` | Créez votre premier service | Planification d'un service | `/planning` |
| `first-reservation` | Acceptez une réservation | Création/confirmation d'une résa | `/reservations` |

## Empty States

Chaque page qui correspond à une tâche "Getting Started" doit avoir un **empty state actif** quand il n'y a pas encore de données. L'empty state remplace le message "Aucune donnée" par un CTA qui guide l'utilisateur.

### Pattern à suivre

```tsx
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={RelevantIcon} className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold">Titre contextuel</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Description qui explique la valeur de cette fonctionnalité.
        </p>
      </div>
      <Button onClick={handleCreate}>
        CTA principal
      </Button>
    </div>
  )
}
```

**Règles :**
- Icône dans un cercle `bg-muted`, cohérente avec l'icône sidebar de la page
- Titre court et orienté action ("Configurez votre salle", pas "Aucune table")
- Description qui vend la fonctionnalité, pas qui constate le vide
- Un seul CTA, qui lance directement l'action (pas "En savoir plus")

### Pages et empty states attendus

| Page | Condition vide | Titre | CTA |
|------|---------------|-------|-----|
| `/salle` | Aucune table | Configurez votre plan de salle | Ajouter une table |
| `/planning` | Aucun service | Planifiez votre premier service | Créer un service |
| `/reservations` | Aucune résa | Aucune réservation pour le moment | Créer une réservation |
| `/admin` | Aucun employé | Constituez votre équipe | Ajouter un employé |
| `/stocks` | Aucun produit | Suivez vos stocks en temps réel | Ajouter un produit |
| `/fournisseurs` | Aucun fournisseur | Centralisez vos fournisseurs | Ajouter un fournisseur |
| `/cuisine` | Aucune commande cuisine | Les commandes en cuisine apparaîtront ici | — (pas de CTA, c'est alimenté par les résas) |

## Conventions

- **Store** : zustand avec `persist` middleware pour localStorage
- **Composants sidebar** : utilisent les primitives `SidebarGroup`, `SidebarMenu`, etc.
- **Icônes** : Hugeicons avec `strokeWidth={2}`
- **Liens** : React Router `<Link>`, jamais `window.location`
- **Pas de gamification excessive** : barre de progression + checks animés, c'est tout
