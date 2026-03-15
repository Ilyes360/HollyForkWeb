# Backend - Django (Holly Pi répliqué)

Le backend HollyForkWeb utilise désormais la même structure que **holly_pi** : apps modulaires, schéma Restaurant → Salles → Tables, API JWT.

## Structure

- **`config/`** – settings, urls, wsgi
- **`apps/`** – applications holly_pi :
  - `authentication` (HollyUser, JWT, login, register, profile)
  - `restaurant`, `staff`, `salles`, `menu`, `commandes`, `inventory`, `billing`
  - `reservations`, `notes`, `dashboard`, `planning`, `suppliers`, `settings`, `reports`

L’ancienne app **`api/`** n’est plus utilisée (présente dans le dépôt mais retirée de `INSTALLED_APPS`).

## Setup

1. Créer et activer un environnement virtuel :
```bash
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Fichier `.env` (optionnel) :
```
SECRET_KEY=your-secret-key-here
DEBUG=True
```

4. **Première fois** : si vous aviez déjà une base `db.sqlite3` avec l’ancien backend, supprimez-la (le modèle utilisateur a changé) :
```bash
del db.sqlite3   # Windows
# rm db.sqlite3  # macOS/Linux
```

5. Migrations :
```bash
python manage.py migrate
```

6. Créer un superutilisateur :
```bash
python manage.py createsuperuser
```
(utilisez le champ **username** + mot de passe ; le modèle est `HollyUser`.)

7. Lancer le serveur :
```bash
python manage.py runserver
```

Le serveur tourne sur http://localhost:8000

### Génération de données factices (optionnel)

Une commande Django permet de remplir la base avec des données de démo (restaurants, employés, salles, tables, articles, commandes, réservations, factures, etc.) :

```bash
pip install mimesis   # si pas déjà installé
python manage.py generate_fake_data --confirm
```

**Attention** : cette commande **supprime toutes les données existantes** puis recrée un jeu de données cohérent (dont le restaurant « Les Ombres et Bar », des employés de test, etc.). Utilisez `--confirm` pour confirmer.

## API

- **Authentification** : JWT (Bearer). Login : `POST /api/auth/login/` (username + password) → renvoie `access` / `refresh`.
- **Documentation** : http://localhost:8000/api/docs/ (Swagger), http://localhost:8000/api/redoc/
- **Schéma** : http://localhost:8000/api/schema/

Principaux préfixes : `/api/restaurants/`, `/api/salles/`, `/api/tables/`, `/api/commandes/`, `/api/lignes-commandes/`, `/api/factures/`, `/api/auth/`, `/api/dashboard/`, `/api/planning/`, etc. (voir `config/urls.py`).

## Frontend

Le frontend actuel (React) est conçu pour l’ancienne API (Token auth, routes type `/api/salles/`, `/api/reservations/`, etc.). Pour utiliser ce backend holly_pi il faudra adapter le frontend pour :

- utiliser l’auth **JWT** (Bearer) et les endpoints `/api/auth/login/`, `/api/auth/register/`, etc. ;
- appeler les ressources **restaurant** (`/api/restaurants/`) et les URLs telles que définies dans la doc holly_pi (ex. `API_DOCUMENTATION.md` du projet joint).
