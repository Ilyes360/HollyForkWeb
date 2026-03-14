# HollyForkWeb

A full-stack web application built with Django (backend) and React (frontend).

## Project Structure

```
HollyForkWeb/
├── backend/          # Django backend application
│   ├── config/      # Django project settings
│   ├── api/         # API app
│   └── manage.py
├── frontend/        # React frontend application
│   ├── src/         # React source files
│   └── public/      # Public assets
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

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

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

## API Endpoints

- `GET /api/` - API root endpoint

## Development

### Backend
- Django REST Framework is configured for API development
- CORS is enabled for localhost:3000
- SQLite database is used by default

### Frontend
- React 18 with modern hooks
- Axios for API calls
- Proxy configured to forward API requests to Django backend

## Technologies Used

### Backend
- Django 4.2.7
- Django REST Framework
- django-cors-headers
- python-dotenv

### Frontend
- React 18.2.0
- Axios
- React Scripts

## License

This project is open source and available under the MIT License.

