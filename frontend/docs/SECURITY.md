# Holy Fork — Security Documentation

> Document à destination de l'équipe cybersécurité.
> Dernière mise à jour : 2026-05-15.
> Voir aussi : `CLAUDE.md` §22 pour les règles développeurs.

---

## 1. Vue d'ensemble

| Champ | Valeur |
|-------|--------|
| Application | Holy Fork — Dashboard SaaS B2B gestion de restaurant |
| Type | Single Page Application (SPA) React |
| Déploiement cible | Vercel (frontend statique) |
| Backend | Django REST Framework — API REST JSON |
| Données sensibles | Réservations clients (nom, téléphone, email), données financières (facturation, paiements), données employés |
| Conformité visée | RGPD (données personnelles clients/employés EU) |

---

## 2. Architecture de sécurité

```
┌──────────────┐     HTTPS      ┌─────────────────┐     HTTP      ┌──────────────┐
│   Navigateur  │ ────────────→ │   Vercel CDN     │              │              │
│   (SPA React) │               │   (static files) │              │              │
│               │               └─────────────────┘              │   Django     │
│  localStorage │     HTTPS + JWT Bearer                          │   Backend    │
│  ┌──────────┐ │ ────────────────────────────────────────────→  │   (DRF)     │
│  │ access   │ │                                                │              │
│  │ refresh  │ │  ←──────── JSON (snake_case) ──────────────── │  PostgreSQL  │
│  └──────────┘ │                                                │              │
│               │  Cookie: csrftoken ←─────────────────────────  │              │
└──────────────┘                                                 └──────────────┘
```

### Frontière de confiance

Le frontend est **100% côté client** — tout le code JS, les variables d'environnement `VITE_*`, et le contenu du bundle sont visibles par l'utilisateur. **Aucune donnée sensible ne doit transiter par le frontend sans chiffrement/protection backend.**

---

## 3. Authentification

### 3.1 Flux de login

```
1. POST /api/auth/login/  { username, password }
2. ← 200 { accessToken, refreshToken, userId, restaurantId, ... }
3. Frontend stocke accessToken + refreshToken en localStorage
4. Toute requête API : header Authorization: Bearer {accessToken}
```

### 3.2 Stockage des tokens

| Élément | Stockage | Clé |
|---------|----------|-----|
| Access token JWT | `localStorage` | `holy_access_token` |
| Refresh token | `localStorage` | `holy_refresh_token` |
| User session | `localStorage` (Zustand persist) | `holy-fork-auth` |
| CSRF token | Cookie httpOnly (set par Django) | `csrftoken` |

**Risque connu :** `localStorage` est accessible à tout JavaScript exécuté sur le même domaine. Une faille XSS permettrait de voler les tokens.

**Mitigations en place :**
- React échappe automatiquement le texte rendu (pas d'injection HTML par défaut)
- `dangerouslySetInnerHTML` interdit (1 seule occurrence dans chart.tsx, sans user input)
- Pas de `eval()`, `new Function()`, ou injection dynamique de scripts
- CSRF token protège contre les requêtes cross-origin

**Mitigations à implémenter :**
- CSP stricte (§6)
- Audit a11y des dépendances tierces

**Cible long terme :** migrer vers des cookies `httpOnly` + `Secure` + `SameSite=Strict` côté backend Django. Cela nécessite un changement dans le flow d'authentification backend (retourner les tokens en cookie plutôt qu'en body JSON).

### 3.3 Refresh token

```
Sur 401 Unauthorized :
1. Interceptor ky (beforeRetry) déclenche le refresh
2. POST /api/auth/token/refresh/  { refresh: refreshToken }
3. ← 200 { access: newAccessToken }
4. Mise à jour localStorage, retry de la requête originale
5. Si le refresh échoue : clearTokens() + clearUser() + redirect /login
```

- Le refresh est **dédupliqué** (flag `isRefreshing` + Promise partagée) pour éviter les race conditions lors de requêtes parallèles.
- Retry limité à **1 tentative** sur 401 uniquement.

### 3.4 Logout

```
POST /api/auth/logout/
→ clearTokens() (supprime access + refresh de localStorage)
→ clearUser() (reset Zustand store)
→ queryClient.clear() (purge le cache TanStack Query)
→ redirect /login
```

### 3.5 Guards de route

| Guard | Protection |
|-------|-----------|
| `AuthGuard` | Vérifie la présence du token + appel `GET /api/auth/profile/` pour valider la session. Redirige vers `/login` si invalide. |
| `GuestGuard` | Redirige vers `/` si déjà authentifié (empêche l'accès à la page login). |
| `PermissionGuard` | Vérifie les permissions spécifiques de l'utilisateur (rôles/groupes). |

### 3.6 Dev mode — Risque

Le "dev mode" (`useDevModeStore`) bypass toutes les vérifications d'authentification. **Protections :**
- Le toggle n'est rendu que si `import.meta.env.DEV === true` (conditionnel dans `main.tsx`)
- Le store Zustand DOIT ignorer la valeur persistée si `import.meta.env.DEV === false`
- En production, même si un attaquant modifie `localStorage` pour mettre `isDevMode: true`, les hooks data appellent toujours l'API réelle (les endpoints backend vérifient le JWT)
- **Risque résiduel** : le guard de route est bypassé en dev mode, donc l'UI est accessible, mais les données ne le sont pas (les requêtes API échoueront sans token valide)

---

## 4. Protection CSRF

### 4.1 Mécanisme

```
1. Au démarrage : GET /api/auth/csrf-token/ → set cookie csrftoken
2. Le client extrait le token : document.cookie.match(/csrftoken=([^;]*)/)
3. Sur chaque mutation (POST/PUT/PATCH/DELETE) : header X-CSRFToken: {token}
```

### 4.2 Fichiers impliqués

- `src/api/client.ts` lignes 41-50 : extraction cookie
- `src/api/client.ts` lignes 86-92 : injection header
- `src/main.tsx` : appel `ensureCsrfCookie()` au démarrage

### 4.3 Limites

- Le CSRF token protège contre les requêtes cross-origin (attaquant sur un autre domaine)
- Ne protège PAS contre le XSS (un script injecté sur le même domaine peut lire le cookie et le header)
- Le vrai rempart contre le XSS est la CSP + l'absence d'injection HTML

---

## 5. Protection XSS

### 5.1 Protections actives

| Protection | Statut | Détail |
|-----------|--------|--------|
| React text escaping | **Actif** | React échappe automatiquement tout texte rendu via `{}` |
| `dangerouslySetInnerHTML` interdit | **Actif** (1 exception) | `chart.tsx` : génère des CSS variables, pas de user input |
| Pas de `eval()` / `new Function()` | **Actif** | Aucune occurrence dans le codebase |
| Pas de `document.write()` | **Actif** | Aucune occurrence |
| CSP | **NON IMPLÉMENTÉE** | Priorité haute — voir §6 |
| Sanitization library (DOMPurify) | **NON INSTALLÉE** | À installer si besoin de rendre du HTML |
| URL protocol validation | **NON IMPLÉMENTÉE** | À ajouter si des URLs utilisateur sont utilisées dans des `href` |

### 5.2 Vecteurs d'attaque potentiels

| Vecteur | Risque | Mitigation |
|---------|--------|-----------|
| Injection HTML via données API | **Bas** (React escape) | Ne jamais utiliser `dangerouslySetInnerHTML` avec des données API |
| Bibliothèques tierces avec faille XSS | **Moyen** | Audit `pnpm audit`, mise à jour proactive |
| Injection via URL params (React Router) | **Bas** | `useParams()` retourne des strings, pas de HTML rendering |
| Mapbox custom markers/popups | **Moyen** | Mapbox GL permet du HTML dans les popups — ne jamais y mettre de données utilisateur non échappées |
| `href` avec `javascript:` | **Bas** (non implémenté) | Aucun lien dynamique basé sur input utilisateur actuellement |

---

## 6. Content Security Policy (CSP) — À implémenter

### 6.1 Politique cible

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.mapbox.com https://*.tiles.mapbox.com;
  connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://data.geopf.fr;
  worker-src 'self' blob:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### 6.2 Notes

- `'unsafe-inline'` pour `style-src` est nécessaire car Tailwind CSS injecte des styles inline. À terme, migrer vers des nonces si possible.
- `script-src 'self'` sans `'unsafe-eval'` ni `'unsafe-inline'` — protège contre l'exécution de scripts injectés.
- `connect-src` liste les APIs externes autorisées (Mapbox, géocodage français).
- `frame-src 'none'` empêche l'embedding dans des iframes (protection clickjacking).

### 6.3 Implémentation

**Option A — Vercel headers (`vercel.json`)** :
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; ..." },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(self)" }
      ]
    }
  ]
}
```

**Option B — Meta tag (`index.html`)** :
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; ...">
```

Option A est préférée (headers HTTP > meta tags).

---

## 7. Gestion des secrets

### 7.1 Variables d'environnement

| Variable | Type | Exposée dans le bundle | Risque |
|----------|------|----------------------|--------|
| `VITE_MAPBOX_ACCESS_TOKEN` | Clé publique Mapbox | **Oui** (c'est un VITE_*) | Bas — clé publique, restreinte par domaine dans le dashboard Mapbox |

### 7.2 Règles

- **Toute variable `VITE_*`** est injectée dans le bundle JS en clair. Ne JAMAIS y mettre de secret.
- **`.env.local`** est gitignored (`*.local` dans `.gitignore`). Vérifié.
- **`.env.example`** contient un placeholder `pk.xxx` — pas de vraie clé.
- Les secrets backend (clés API, credentials DB) ne transitent JAMAIS par le frontend.

### 7.3 Rotation des clés

Le token Mapbox est une clé publique restreinte par URL dans le dashboard Mapbox. En cas de compromission :
1. Révoquer le token dans le dashboard Mapbox
2. Générer un nouveau token avec les mêmes restrictions d'URL
3. Mettre à jour `.env.local` et les variables d'environnement Vercel

---

## 8. Dépendances tierces

### 8.1 Dépendances à risque élevé

| Dépendance | Raison du risque | Mitigation |
|-----------|-----------------|-----------|
| `mapbox-gl` | Exécute du WebGL, charge des tuiles depuis CDN Mapbox | CSP `connect-src` restreinte, pas de user input dans les popups |
| `konva` / `react-konva` | Rendering Canvas, manipulation DOM bas niveau | Pas de user input direct dans le canvas rendering |
| `recharts` | SVG rendering, potentiel XSS dans les tooltips | Tooltips customisés avec texte brut, pas de HTML |
| `ky` | Client HTTP, interceptors manipulent les headers | Code audité, pas de logique custom à risque |

### 8.2 Audit

```bash
# Audit des dépendances
pnpm audit

# Audit des vulnérabilités connues (production only)
pnpm audit --prod

# Mise à jour des dépendances avec CVE
pnpm update --latest
```

**Fréquence** : avant chaque release, ou immédiatement si un CVE critique est publié.

**CI (quand en place)** : `pnpm audit --audit-level=high` comme étape bloquante.

---

## 9. Données personnelles (RGPD)

### 9.1 Données stockées côté client

| Donnée | Stockage | Durée | Justification |
|--------|----------|-------|---------------|
| User session (id, email, nom) | localStorage (Zustand persist) | Jusqu'au logout | Navigation fluide sans re-login |
| JWT tokens | localStorage | Jusqu'au logout ou expiration | Authentification API |
| Restaurant sélectionné | localStorage (Zustand persist) | Persistent | UX (mémoriser le dernier restaurant) |
| Sidebar state | Cookie (7j) | 7 jours | UX (mémoriser l'état ouvert/fermé) |
| Préférences thème | localStorage | Persistent | UX (mode sombre) |

### 9.2 Données en transit

- **Réservations** : nom client, téléphone, email, nombre de couverts
- **Employés** : nom, prénom, email, téléphone, type de poste
- **Facturation** : montants, TVA, méthodes de paiement

Toutes ces données transitent en HTTPS (TLS) entre le navigateur et le backend. Le frontend ne stocke ces données que dans le cache TanStack Query (en mémoire, purgé au logout).

### 9.3 Purge des données au logout

```typescript
// Dans useLogout() :
clearTokens()        // Supprime les JWT de localStorage
clearUser()          // Reset le store Zustand auth
queryClient.clear()  // Purge TOUT le cache TanStack Query (données en mémoire)
```

Après logout, aucune donnée personnelle ne subsiste côté client (sauf les préférences UI non-sensibles).

---

## 10. Modèle de menaces (STRIDE simplifié)

| Menace | Type | Probabilité | Impact | Mitigation |
|--------|------|-------------|--------|-----------|
| Vol de JWT via XSS | Spoofing | Moyenne | Haute | CSP stricte, pas de `dangerouslySetInnerHTML`, React escape |
| CSRF sur mutations | Tampering | Basse | Haute | Token CSRF + header `X-CSRFToken` |
| Énumération des endpoints | Information Disclosure | Basse | Basse | Swagger UI désactivé en prod (responsabilité backend) |
| Brute force login | Denial of Service | Moyenne | Moyenne | Rate limiting backend (`429`), pas de rate limiting frontend |
| Injection via données restaurant | Tampering | Basse | Moyenne | React text escaping, validation Zod |
| Dépendance compromise (supply chain) | Elevation of Privilege | Basse | Haute | `pnpm audit`, lockfile, CSP |
| Dev mode activé en prod | Spoofing | Très basse | Haute | Guard `import.meta.env.DEV`, API backend vérifie le JWT |
| Clickjacking | Spoofing | Basse | Moyenne | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |

---

## 11. Checklist d'audit sécurité

À exécuter avant chaque release majeure ou audit de sécurité :

### Infrastructure
- [ ] CSP headers configurés sur Vercel (ou meta tag)
- [ ] `X-Content-Type-Options: nosniff` configuré
- [ ] `X-Frame-Options: DENY` configuré
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` configuré
- [ ] HTTPS forcé (Vercel le fait par défaut)
- [ ] `.env.local` dans `.gitignore` (vérifié : `*.local` est exclu)

### Code
- [ ] Aucun `dangerouslySetInnerHTML` avec des données utilisateur
- [ ] Aucun `eval()`, `new Function()`, `document.write()`
- [ ] Aucun secret dans les variables `VITE_*`
- [ ] Tokens JWT nettoyés au logout
- [ ] Cache TanStack Query purgé au logout
- [ ] Dev mode gardé par `import.meta.env.DEV`
- [ ] CSRF token injecté sur les mutations

### Dépendances
- [ ] `pnpm audit` : 0 vulnérabilité high/critical
- [ ] Dépendances à jour (pas de CVE connue non patchée)
- [ ] lockfile (`pnpm-lock.yaml`) commité et à jour

### Tests
- [ ] Tests d'intégration auth (login, logout, token refresh, guard) passent
- [ ] MSW handlers couvrent les scénarios d'erreur (401, 403, 429)

---

## 12. Contacts et responsabilités

| Rôle | Responsabilité |
|------|---------------|
| Équipe frontend | Maintien du code, respect des règles CLAUDE.md §22 |
| Équipe cyber | Audit périodique, validation CSP, revue des dépendances |
| Équipe backend | Auth (JWT, CSRF, rate limiting, CORS), validation des données, RGPD serveur |

---

## 13. Historique des audits

| Date | Auditeur | Résultat | Actions |
|------|----------|---------|---------|
| 2026-05-15 | Audit initial | CSP manquante, documentation sécurité absente | Création de ce document, ajout §22 dans CLAUDE.md |
