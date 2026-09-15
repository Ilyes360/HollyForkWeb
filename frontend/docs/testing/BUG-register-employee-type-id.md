# Bug bloquant — Inscription publique cassée par un ID hardcodé

> Statut : **ouvert, bloquant**. Trouvé le 2026-09-15 en écrivant des tests d'intégration
> Auth contre un vrai backend (`localhost:8000`), au lieu de mocks MSW.
> Périmètre : Auth — unité 2a-pages (RegisterPage).

## Problème

`src/pages/public/register.tsx` envoie systématiquement `type_employe_id: 383` à
`POST /api/auth/register/` :

```typescript
// Super Admin Groupe — un gérant qui s'inscrit doit avoir tous les droits
const DEFAULT_EMPLOYEE_TYPE_ID = 383
```

`383` est l'ID auto-incrémenté (PK Django) de la ligne `TypeEmploye` dont
`nom_type = "Super Admin Groupe"` — mais **cet ID dépend entièrement de
l'historique de la base de données**, pas d'une valeur métier stable.

## Preuve

Sur le backend local (`localhost:8000`, projet `holly_pi`) :

```bash
$ curl -s "http://localhost:8000/api/type-employes/?page_size=100" -H "Authorization: Bearer $TOKEN"
# 8 lignes, IDs 25 à 32
# {"id": 25, "type_name": "Super Admin Groupe", ...}
```

`Super Admin Groupe` a l'ID **25** ici, pas 383. Résultat d'un vrai appel
d'inscription contre ce backend :

```bash
$ curl -X POST http://localhost:8000/api/auth/register/ -d '{... "type_employe_id": 383 ...}'
# HTTP 400
{"type_employe_id": ["Clé primaire « 383 » non valide - l'objet n'existe pas."]}
```

## Cause racine

Le modèle backend (`holly_pi/apps/staff/models.py`) :

```python
class TypeEmploye(models.Model):
    id = models.AutoField(primary_key=True)
    nom_type = models.CharField(max_length=50, unique=True)
    # pas de champ "is_default", pas de slug, pas de scope restaurant
```

`TypeEmploye` est bien une table **globale** (pas de FK restaurant), donc `383`
référencerait le même rôle partout — mais son ID est un simple auto-increment.
Le script de seed (`holly_pi/scripts/generate_fake_data.py`) crée ces lignes
via `TypeEmploye.objects.create(**d)` sans jamais fixer d'ID : la valeur finale
dépend de combien de lignes existaient déjà en base au moment du seed.

Résultat : `383` n'est correct que sur l'environnement précis où le
développeur a écrit ce code (probablement une base avec beaucoup plus
d'historique que ce backend local fraîchement seedé). Rien ne garantit que
cette valeur reste correcte en production après un reseed, une migration de
données, ou simplement le passage du temps.

## Impact

- **Bloquant sur ce backend local** : `/register` ne peut jamais aboutir
  (échoue toujours en 400 sur `type_employe_id`).
- **Erreur non actionnable pour l'utilisateur** : `type_employe_id` n'est pas
  un champ du formulaire (`RegisterFormValues` n'a pas cette clé). Le mapping
  d'erreur dans `register.tsx` (`form.setError(fieldName as keyof RegisterFormValues, ...)`)
  essaie de poser l'erreur sur un champ qui n'existe pas dans le formulaire —
  rien ne s'affiche dans le formulaire. Seule trace visible : le toast
  générique de secours de `useMutationWithDefaults` (`handleMutationError`),
  qui affiche le message technique brut de `ky`
  (`"Request failed with status code 400 Bad Request: POST .../auth/register/"`)
  — jamais la vraie raison ("type_employe_id invalide"). Confirmé par test
  d'intégration contre le vrai backend
  (`RegisterPage > KNOWN BUG ... silently fails`, `pages.test.tsx`).
- **Risque en production** : si la base de prod a été reseedée ou migrée
  depuis l'écriture de ce code, le même échec silencieux s'y produit. Non
  vérifié (accès VPS indisponible depuis cet environnement au moment de la
  rédaction).
- Le même fichier a déjà un TODO adjacent sur `PLACEHOLDER_RESTAURANT_ID = 1`
  — indice que ce flux d'inscription a été écrit comme pont temporaire, pas
  comme implémentation finalisée.

## Correction recommandée (backend + frontend)

Ne pas remplacer `383` par `25` — ça ne fait que déplacer le même problème
sur un autre environnement. Le backend doit exposer un moyen **stable** de
désigner ce rôle par défaut, par exemple :

- Un champ `is_default_admin_role: bool` sur `TypeEmploye`, exposé par
  l'API, et le frontend interroge `/api/type-employes/?is_default_admin_role=true`
  au lieu d'envoyer un ID en dur ; ou
- Un `slug` stable (`"super-admin-groupe"`) sur `TypeEmploye`, et le
  endpoint d'inscription accepte ce slug plutôt qu'un PK numérique ; ou
- Le backend assigne lui-même le type par défaut côté serveur lors de
  l'inscription publique (le frontend n'envoie pas `type_employe_id` du
  tout dans ce flux).

Tant que ce n'est pas fait, `DEFAULT_EMPLOYEE_TYPE_ID` doit au minimum être
rendu configurable par environnement (variable `VITE_*`) plutôt que codé en
dur dans le composant — pour au moins permettre de le corriger sans
déploiement de code sur chaque environnement.

## Suivi test

Le test d'intégration "happy path" de `RegisterPage` contre le vrai backend
ne peut donc pas être vert sur cet environnement tant que ce bug n'est pas
corrigé — voir `src/__tests__/integration/auth/` et le statut documenté dans
`docs/testing/auth.md`. Il ne doit pas être contourné en changeant la valeur
localement dans les tests : ce serait masquer le bug plutôt que le documenter.
