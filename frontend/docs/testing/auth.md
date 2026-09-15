# Auth — Detail couverture

> Unites de travail : `1` Device Login · `2a-hooks` · `2a-pages` · `2b` Guards · `2c-mfa`
>
> Regle : 1 unite = auto → manuel → sign-off.

## 1. Device Login (Critique) — auto Done (A)

Manuel : [manual-device-login.md](manual-device-login.md)

### Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useDeviceLogin() | ✅ | 2 | features/device-login/hooks.test.tsx |
| useQuickLogin() | ✅ | 3 | features/device-login/hooks.test.tsx |
| useRestaurantEmployees() | ✅ | 4 | features/device-login/hooks.test.tsx |

### Composants

| Composant | C2 | C4 a11y | Tests | Fichier test |
|-----------|:--:|:-------:|-------|-------------|
| DeviceSetupStep | ✅ | ✅ | 5 | features/device-login/steps.test.tsx |
| EmployeeSelectStep | ✅ | ✅ | 6 | features/device-login/steps.test.tsx |
| PinLoginStep | ✅ | ✅ | 8 | features/device-login/steps.test.tsx |
| PinPad | ✅ | ✅ | 9+ | features/device-login/pin-pad.test.tsx |

---

## 2a-hooks. Auth hooks (Critique) — auto Done (A-)

Manuel : partiel ([manual-auth.md](manual-auth.md) flows 1–4 sans pages register).

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useLogin() | ✅ | 3 | features/auth/hooks.test.tsx |
| useRegister() | ✅ | 1 | features/auth/hooks.test.tsx |
| useLogout() | ✅ | 2 | features/auth/hooks.test.tsx |
| useProfile() | ✅ | 2 | features/auth/hooks.test.tsx |
| useAuthStore | ✅ | 5 | integration/auth/auth-store.test.ts |

`2a-pages` et `2b` ont leur auto Done ci-dessous. Sign-off feature Auth **interdit** tant que le manuel associe (scenarios guards + pages dans [manual-auth.md](manual-auth.md)) n'est pas execute (+ `2c-mfa` si MFA en prod).

---

## 2a-pages. Auth pages (Critique) — auto Done (A-)

Manuel : [manual-auth.md](manual-auth.md) (+ register / forgot a completer).

> **⚠️ Ces tests tapent le VRAI backend local**, pas MSW — voir §"Tests contre
> le vrai backend" ci-dessous.

| Page | C2 | C4 a11y | Tests | Notes |
|------|:--:|:-------:|-------|-------|
| LoginPage | ✅ | ✅ | 9 | Rendu, validation vide, redirect `from`/`/`, transform email→username (reel), 400 reel (mauvais mdp), liens register/device, loading disabled |
| RegisterPage | ✅ | ✅ | 5 | Rendu, validation vide (Requis/email/8 car.), mismatch password, 400 reel (email dupliquee), **happy path reel** (inscription reussie) |
| ForgotPasswordPage | ✅ | ✅ | 3 | Page **placeholder non fonctionnelle** en prod (input+bouton `disabled`, `<form>` sans `onSubmit`) — voir dette ci-dessous |

Fichier test : `features/auth/pages.test.tsx` (17 tests — 9+5+3).

**Fix a11y applique (petit, necessaire pour tester) :** `FormControl` (base-maia) clone son enfant direct pour poser `id`/`aria-describedby`. Sur les champs a icone (`login.tsx`, `register.tsx`, `forgot-password.tsx`), l'enfant de `FormControl` etait le `<div className="relative">` englobant l'icone — pas l'`<input>` — donc le `<label htmlFor>` pointait vers un `<div>` non labellable (violation reelle, `getByLabelText` echouait). Corrige en inversant l'imbrication : l'icone reste positionnee en `absolute` a cote de `FormControl`, qui wrap directement `<Input>`/`<PasswordInput>`. Aucun changement visuel ou de comportement.

**Dette documentee — ForgotPasswordPage :** la page est un placeholder (`docs/testing/manual-auth.md` doit refleter cet etat). Il n'existe aucun flux Zod/API a tester : le champ email et le bouton sont `disabled`, et le `<form>` n'a pas de handler `onSubmit`. Les tests couvrent le rendu reel (message d'indisponibilite, champs desactives, lien retour connexion) — pas de test "happy path" ni "erreur API" car ce comportement n'existe pas dans le code. A completer quand la feature sera implementee cote backend.

**Dette documentee — double toast sur erreur login/register :** `useLogin`/`useRegister` utilisent `useMutationWithDefaults`, qui applique un `onError` par defaut (toast generique via `handleMutationError`) *en plus* du `onError` specifique passe au call-site (`mutate(data, { onError })`). Les deux se declenchent sur toute erreur. Comportement pre-existant, hors scope de cette unite — les tests assertent sur le comportement cible (message de champ / toast attendu), pas sur "un seul toast".

**✅ Bug corrigé (2026-09-15) — RegisterPage happy path :** `DEFAULT_EMPLOYEE_TYPE_ID = 383` (hardcode) ne correspondait a aucune ligne `TypeEmploye` sur certains backends. Corrige des deux cotes : le backend (`holly_pi`, `UserRegistrationSerializer`) resout desormais "Super Admin Groupe" lui-meme par son nom quand `type_employe_id` est omis (garde-fou : toujours requis pour l'invitation admin) ; le frontend n'envoie plus ce champ a l'inscription publique. Voir [BUG-register-employee-type-id.md](BUG-register-employee-type-id.md) pour l'historique complet et les deux docs d'action associees. Le test `RegisterPage > registers successfully...` verifie desormais un vrai succes d'inscription de bout en bout.

**Scenario retire — 429 (rate limit) :** impossible a provoquer de façon sure contre le compte de test partage `root` sans risquer un verrouillage qui casserait tous les autres tests. Retire de la suite plutot que fabrique.

Perimetre unite : rendu, validation Zod, erreurs API affichees, loading submit, liens `/device`. MFA → unite **2c-mfa**.

---

## 2b. Auth Guards (Critique) — auto Done (A)

Manuel : scenarios guards dans [manual-auth.md](manual-auth.md) (a etendre : route protegee sans token, guest redirect).

> **⚠️ Ces tests tapent le VRAI backend local**, pas MSW — voir §"Tests contre
> le vrai backend" ci-dessous.

| Guard / hook | Teste | Tests | Notes |
|--------------|:-----:|-------|-------|
| AuthGuard | ✅ | 7 | No token → `/login`+`state.from` ; token reel valide → Outlet ; loading (spinner `role="status"`) ; token invalide (401 reel) → clear+redirect ; `auth:logout` cross-tab ; `holy_pending_restaurant` → `/onboarding` ; dev mode bypass |
| GuestGuard | ✅ | 3 | Authed+token → `/` ; non authed → Outlet ; dev mode → `/` (aucun appel reseau, store+token only) |
| PermissionGuard | ✅ | 5 | Loading (spinner) ; `require`/`requireAny` fail/success avec les **vraies** permissions du compte `root` |
| usePermissions() | ✅ (indirect) | — | Couvert via PermissionGuard (`can`/`canAny` exerces par les scenarios require/requireAny) |
| useActiveRestaurant() | ❌ | — | Hors perimetre 2b — pas de guard ne l'utilise directement, a rattacher a une unite restaurant-context si besoin |

Fichier test : `features/auth/guards.test.tsx` (15 tests).

**Fix a11y applique (petit, necessaire pour tester) :** les spinners de chargement dans `auth-guard.tsx` et `permission-guard.tsx` n'avaient ni role ni label (impossible a cibler par `getByRole`/label sans `data-testid`). Ajout de `role="status" aria-label="Chargement"` sur le conteneur. Aucun changement visuel.

**Token "invalide" et non "expire" :** un JWT expire ne peut pas etre fabrique sans la clé de signature du backend. Le test utilise un token invalide (chaine arbitraire) qui produit un vrai 401 — meme chemin de code que l'expiration (`isError` → clear + redirect), comportement equivalent.

---

## Tests contre le vrai backend (2a-pages, 2b)

Depuis 2026-09-15, `features/auth/pages.test.tsx` et `features/auth/guards.test.tsx` **ne
utilisent plus MSW** — ils appellent le vrai backend local (`API_PROXY_TARGET` dans
`.env.local`, `vite.config.ts` §test.env). `features/auth/hooks.test.tsx` (2a-hooks)
n'est **pas** concerne, reste sur MSW.

- **Prerequis** : le backend `holly_pi` doit tourner sur `localhost:8000` (ou l'URL de
  `API_PROXY_TARGET`). Un `beforeAll` (`ensureBackendReachable()`, `src/test/real-backend.ts`)
  echoue vite et clairement si ce n'est pas le cas.
- **Compte de test** : `root` / `root` — compte dedie, "tout est permis dessus" (confirme
  par l'utilisateur). Permissions reelles utilisees pour les cas positifs/negatifs de
  `PermissionGuard` (`manage_staff` present, `manage_stocks`/`manage_suppliers` absents).
- **Mecanisme** : `passthroughReal()` (`src/test/real-backend.ts`) enregistre des handlers
  MSW `passthrough()` sur les routes concernees, pour laisser passer la vraie requete
  reseau au lieu de la mocker. Le `server` MSW partage reste actif pour tout le reste de
  la suite (les autres domaines/tests, wildcard host `*/api/...`, ne voient aucune
  difference).
- **Effets de bord reels** : `RegisterPage` cree un vrai utilisateur en base a chaque run
  (email unique via timestamp) — pollution DB assumee, pas de nettoyage automatique.
- **Non teste (documente, pas contourne)** : 429 (risque de lockout du compte partage),
  token vraiment expire (pas de clé de signature disponible cote frontend).
- **⚠️ Piege observe en conditions reelles** : le backend applique un throttle global
  `anon: 100/hour` (DRF, `holly_pi/settings.py`). Relancer la suite `pages.test.tsx` +
  `guards.test.tsx` plusieurs fois d'affilée (chacune fait ~15-20 vrais appels HTTP)
  + des `curl` manuels de verification peut epuiser ce quota en quelques minutes → tous
  les tests echouent alors sur `ensureBackendReachable()` (429), sans rapport avec le
  code. Solution : attendre (le quota se libere progressivement, `Retry-After` dans la
  reponse indique combien de temps), pas relancer en boucle (chaque tentative ajoute
  des requetes et peut prolonger l'attente).

---

## 2c-mfa. Auth MFA (Critique) — A faire si MFA en prod

Manuel : etendre [manual-auth.md](manual-auth.md) (setup TOTP, verify login, disable).

| Surface | Teste | Notes |
|---------|:-----:|-------|
| useMfaSetup / Confirm / Disable | ❌ | hooks |
| Ecran code TOTP post-login | ❌ | page / composant |
| Recovery / erreurs 400-429 | ❌ | |

Sauter cette unite si MFA non deploye.

---

## Hors-feature

| Fichier test | Type |
|-------------|------|
| integration/auth/logout.test.tsx | Smoke navigation |
| integration/dev-mode/* | Dev mode |
