# HollyForkWeb

Application web full-stack (Django + React), basée sur le backend **Holly Pi** : apps modulaires, JWT, authentification email + mot de passe, MFA (TOTP).

## Structure du projet

```
HollyForkWeb/
├── backend/              # Backend Django (style Holly Pi)
│   ├── config/           # Settings, urls, wsgi
│   ├── apps/             # Applications modulaires
│   │   ├── authentication/  # Auth (login email+password, JWT, MFA, register, profile)
│   │   ├── restaurant/   # Restaurants, salles, tables
│   │   ├── menu/         # Articles, catégories
│   │   ├── commandes/    # Commandes, lignes
│   │   ├── staff/        # Employés, types, PIN
│   │   ├── billing/      # Factures, paiements
│   │   └── ...           # reservations, notes, inventory, planning, etc.
│   ├── scripts/          # Scripts (ex. generate_fake_data.py)
│   └── manage.py
├── frontend/             # Frontend React
│   ├── src/
│   └── public/
└── README.md
```

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher and npm
- pip (Python package manager)

## Setup Instructions

### Backend Setup (Django)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
```

5. (Première installation) Si vous aviez une ancienne base, supprimez `db.sqlite3` puis exécutez les migrations :
```bash
python manage.py migrate
```

6. Créer un superutilisateur ou générer des données factices (optionnel) :
```bash
python manage.py createsuperuser
# ou : pip install mimesis && python manage.py generate_fake_data --confirm
```
Comptes de test après génération : `root@hollypi.com` / `root`, `test@lesombres.com` / `Test1234!`

7. Start the Django development server:
```bash
python manage.py runserver
```

The backend will run on http://localhost:8000

### Frontend Setup (React)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:8000/api
```

4. Start the React development server:
```bash
npm start
```

The frontend will run on http://localhost:3000

## Running the Application

1. Start the Django backend server (in the `backend` directory):
```bash
python manage.py runserver
```

2. Start the React frontend server (in the `frontend` directory):
```bash
npm start
```

3. Open your browser and navigate to http://localhost:3000

## API

- **Auth** : `POST /api/auth/login/` (email + mot de passe), `POST /api/auth/register/`, `POST /api/auth/delete-account/`, MFA (setup, verify-mfa), etc. En-tête : `Authorization: Bearer <jwt>` ou `Token <jwt>`.
- **Documentation** : http://localhost:8000/api/docs/ (Swagger), http://localhost:8000/api/redoc/
- **Préfixes** : `/api/auth/`, `/api/restaurants/`, `/api/salles/`, `/api/commandes/`, `/api/menu/`, etc. Voir `backend/README.md` et `backend/apps/authentication/README.md`.

## Development

### Backend
- Django REST Framework, JWT (Simple JWT), MFA TOTP (pyotp)
- Authentification par **email + mot de passe** ; header `Authorization: Bearer` ou `Token`
- CORS activé pour localhost:3000, base SQLite par défaut
- Documentation OpenAPI (drf-spectacular) : `/api/docs/`, `/api/redoc/`

### Frontend
- React 18 with modern hooks
- Axios for API calls
- Proxy configured to forward API requests to Django backend

## Technologies Used

### Backend
- Django, Django REST Framework
- djangorestframework-simplejwt (JWT), pyotp (MFA)
- django-cors-headers, drf-spectacular (OpenAPI/Swagger)
- python-dotenv

### Frontend
- React 18.2.0
- Axios
- React Scripts

## License

This project is open source and available under the MIT License.

