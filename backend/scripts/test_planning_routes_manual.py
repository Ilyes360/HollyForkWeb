#!/usr/bin/env python3
"""
Manual test script for planning API routes. Uses stdlib only (no requests).
Run with backend server running: python manage.py runserver
Then: python scripts/test_planning_routes_manual.py
Or set BASE_URL to your API root (e.g. http://127.0.0.1:8000/api).
Set TOKEN env or pass --login email password to get a token first.
"""
import json
import os
import sys
import urllib.request
import urllib.error

# Add parent so we can use Django to get a token if needed
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

BASE_URL = os.environ.get('BASE_URL', 'http://127.0.0.1:8000/api').rstrip('/')


def request(method, path, data=None, token=None):
    url = f'{BASE_URL}{path}'
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if token:
        headers['Authorization'] = f'Token {token}'
    req = urllib.request.Request(url, method=method, headers=headers)
    if data is not None and method in ('POST', 'PUT', 'PATCH'):
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.getcode(), json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            body = json.loads(body)
        except Exception:
            pass
        return e.code, body
    except Exception as e:
        return None, str(e)


def main():
    token = os.environ.get('TOKEN')
    if '--login' in sys.argv:
        idx = sys.argv.index('--login')
        if idx + 2 >= len(sys.argv):
            print('Usage: --login email password')
            sys.exit(1)
        email, password = sys.argv[idx + 1], sys.argv[idx + 2]
        code, body = request('POST', '/auth/login/', {'email': email, 'password': password})
        if code != 200:
            print('Login failed:', code, body)
            sys.exit(1)
        token = body.get('token')
        print('Token obtained.')
    if not token:
        print('Set TOKEN env or use --login email password')
        sys.exit(1)

    week = '2025-01-27'
    ok = 0
    fail = 0

    # 1) GET planning week
    code, body = request('GET', f'/planning/week/?date={week}', token=token)
    if code == 200 and 'employees' in body and 'capacity' in body and 'alerts' in body:
        print('OK  GET /planning/week/  -> employees, capacity, alerts')
        ok += 1
    else:
        print('FAIL GET /planning/week/ ', code, body)
        fail += 1

    # 2) GET planning week with salle
    code, body = request('GET', f'/planning/week/?date={week}&salle=1', token=token)
    if code == 200:
        print('OK  GET /planning/week/?salle=1')
        ok += 1
    else:
        print('FAIL GET /planning/week/?salle=1 ', code, body)
        fail += 1

    # 3) GET employees (and optional salle)
    code, body = request('GET', '/employees/', token=token)
    if code == 200:
        results = body.get('results', body) if isinstance(body, dict) else body
        print('OK  GET /employees/  ->', len(results) if isinstance(results, list) else '?', 'items')
        ok += 1
    else:
        print('FAIL GET /employees/ ', code, body)
        fail += 1

    code, body = request('GET', '/employees/?salle=1', token=token)
    if code == 200:
        print('OK  GET /employees/?salle=1')
        ok += 1
    else:
        print('FAIL GET /employees/?salle=1 ', code, body)
        fail += 1

    # 4) GET planning-shifts
    code, body = request('GET', '/planning-shifts/', token=token)
    if code == 200:
        print('OK  GET /planning-shifts/')
        ok += 1
    else:
        print('FAIL GET /planning-shifts/ ', code, body)
        fail += 1

    # 5) POST planning week (bulk save) - use first employee id if any
    emp_id = None
    code2, body2 = request('GET', '/employees/', token=token)
    if code2 == 200 and isinstance(body2, dict):
        results = body2.get('results', body2)
        if isinstance(results, list) and results:
            emp_id = results[0].get('id')
    payload = {'weekStart': week, 'shifts': []}
    if emp_id:
        payload['shifts'] = [{'employee_id': emp_id, 'day': 0, 'type': 'Midi', 'start': '11:00', 'end': '15:00'}]
    code, body = request('POST', '/planning/week/', payload, token=token)
    if code == 200 and ('saved' in body or 'weekStart' in body):
        print('OK  POST /planning/week/  (bulk save)')
        ok += 1
    else:
        print('FAIL POST /planning/week/ ', code, body)
        fail += 1

    # 6) POST planning week copy
    target = '2025-02-03'
    code, body = request('POST', '/planning/week/copy/', {'source_date': week, 'target_date': target}, token=token)
    if code == 200 and ('copied' in body or 'targetWeekStart' in body):
        print('OK  POST /planning/week/copy/')
        ok += 1
    else:
        print('FAIL POST /planning/week/copy/ ', code, body)
        fail += 1

    print('---')
    print(f'Result: {ok} passed, {fail} failed')
    sys.exit(0 if fail == 0 else 1)


if __name__ == '__main__':
    main()
