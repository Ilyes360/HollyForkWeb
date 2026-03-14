# Backend - Django Application

This is the Django backend for the HollyForkWeb project.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

The server will run on http://localhost:8000

## API Structure

- `/api/` - API root endpoint
- `/admin/` - Django admin panel

## Features

- Django REST Framework for API development
- CORS enabled for React frontend
- Environment variable configuration
- SQLite database (default)

