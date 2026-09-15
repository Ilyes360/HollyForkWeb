# Frontend — Retirer `type_employe_id` de l'inscription publique

> **À faire seulement après** que le fix backend décrit dans
> `register-employee-type-id-backend.html` soit livré et déployé (au minimum
> sur l'environnement contre lequel tu testes). Vérifier avant de commencer :
>
> ```bash
> curl -X POST http://localhost:8000/api/auth/register/ -H "Content-Type: application/json" -d '{
>   "username": "check_fix_deployed", "email": "check_fix_deployed@example.com",
>   "password": "SecurePass1!", "password2": "SecurePass1!",
>   "employee_first_name": "QA", "employee_last_name": "Test",
>   "pin_code": "1234", "restaurant_id": 1
> }'
> # Si la reponse est 201 (pas 400 sur type_employe_id) → le backend est pret, tu peux commencer.
> ```

## Contexte

`register.tsx` envoyait un `type_employe_id` hardcodé (`383`) qui n'existait pas
sur certains backends — voir `docs/testing/BUG-register-employee-type-id.md`
pour l'historique complet. Le backend a été corrigé pour rendre ce champ
optionnel côté inscription publique (il résout "Super Admin Groupe" lui-même).
Le frontend doit maintenant arrêter de l'envoyer.

## Changements à faire

### 1. `src/pages/public/register.tsx`

Supprimer la constante et son usage dans le payload :

```diff
- // Super Admin Groupe — un gérant qui s'inscrit doit avoir tous les droits
- const DEFAULT_EMPLOYEE_TYPE_ID = 383
-
  /**
   * Placeholder restaurant ID — backend requires restaurant_id on registration.
   ...
   */
  const PLACEHOLDER_RESTAURANT_ID = 1
```

```diff
    registerMutation.mutate(
      {
        username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        firstName: data.firstName,
        lastName: data.lastName,
        employeeFirstName: data.firstName,
        employeeLastName: data.lastName,
        pinCode: generatePin(),
-       typeEmployeId: DEFAULT_EMPLOYEE_TYPE_ID,
        restaurantId: PLACEHOLDER_RESTAURANT_ID,
      },
```

### 2. `src/api/auth/types.ts` — `RegisterRequest`

Rendre le champ optionnel (pas le supprimer entièrement : l'écran d'invitation
admin, s'il existe ou est ajouté plus tard côté staff, en aura toujours
besoin) :

```diff
  export type RegisterRequest = {
    username: string
    email: string
    password: string
    password2: string
    firstName?: string
    lastName?: string
    employeeFirstName: string
    employeeLastName: string
    pinCode: string
-   typeEmployeId: number
+   typeEmployeId?: number
    restaurantId: number
  }
```

Vérifier après ce changement qu'aucun autre appelant de `useRegister()`
(recherche `typeEmployeId` dans `src/`) ne dépend d'un champ requis — au moment
de la rédaction de cette doc, seul `register.tsx` l'utilise.

### 3. Régénérer les types API si le schema OpenAPI a changé

Si le schema publié (`docs/api/openapi.json`) reflète le champ optionnel côté
backend :

```bash
pnpm gen:api
```

Vérifier que `src/types/api.d.ts` (généré, ne pas éditer à la main) ne liste
plus `type_employe_id` dans le tableau `required` du schema d'inscription.

### 4. Tests — `src/__tests__/features/auth/pages.test.tsx`

Le test `RegisterPage > KNOWN BUG (see docs/testing/BUG-register-employee-type-id.md): a fully valid new registration silently fails`
**doit être remplacé**, pas juste supprimé — il pinnait le comportement cassé.
Le remplacer par un vrai test de succès :

```typescript
it("registers successfully and navigates to /login", async () => {
  const user = userEvent.setup()
  const toastSuccessSpy = vi.spyOn(toast, "success")
  const uniqueEmail = `qa.register.${Date.now()}@holyfork.fr`
  renderRegisterPage()

  await fillValidRegisterForm(user, uniqueEmail)
  await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Login Page" })).toBeInTheDocument()
  })
  expect(toastSuccessSpy).toHaveBeenCalledWith("Compte créé avec succès !")
})
```

(Ce test crée un vrai utilisateur en base à chaque run — email unique via
timestamp, comme les autres tests réels de ce fichier. Voir
`docs/testing/auth.md` §"Tests contre le vrai backend" pour le contexte.)

### 5. Docs à mettre à jour une fois le point 4 fait et vert

- `docs/testing/auth.md` — retirer la mention "🔴 Bug bloquant pinné" de la
  section 2a-pages, mettre à jour le nombre de tests RegisterPage et sa
  colonne "Notes" pour refléter un vrai happy path testé.
- `docs/testing/BUG-register-employee-type-id.md` — marquer le statut en
  en-tête comme **résolu** (garder le fichier pour l'historique, ne pas le
  supprimer), avec la date et le lien vers le commit/PR backend qui l'a
  corrigé.
- Ce fichier (`register-employee-type-id-frontend.md`) et
  `register-employee-type-id-backend.html` peuvent être archivés ou supprimés
  une fois le point ci-dessus fait — ce sont des docs d'action, pas des docs
  de référence permanentes.

## Ce qu'il ne faut PAS faire

- Ne pas remettre un ID hardcodé différent (ex: `25`) « en attendant » — c'est
  exactement le bug qu'on corrige, juste déplacé sur un autre environnement.
- Ne pas supprimer `typeEmployeId` complètement du type `RegisterRequest` si
  un autre flux (invitation admin) en a besoin — le rendre optionnel, pas
  l'enlever.
- Ne pas toucher au test des autres pages (`LoginPage`, `ForgotPasswordPage`)
  dans le même fichier — hors périmètre de cette action.
