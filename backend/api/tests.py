"""
Tests for planning API routes: week GET/POST, week copy, employees and planning-shifts with salle filter.
Also profile (GET/PATCH) and reservations (today, by_date, list by salle).
Run: python manage.py test api.tests
"""
from datetime import date, time, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from decimal import Decimal

from .models import (
    Salle,
    Role,
    Client,
    Reservation,
    Detail_Reservation_Table,
    Employee,
    PlanningShift,
    PlanningCapacity,
    UserProfile,
    Categorie_Produit,
    Produit,
    StockMovement,
    Ingredient,
    IngredientMovement,
    Fournisseur,
    CommandeFournisseur,
    LigneCommandeFournisseur,
    Table,
    Commande,
    Ligne_Commande,
    Facture,
    Paiement,
    Menu,
    Plat,
    Appartenance_Menu_Plat,
)

User = get_user_model()


class PlanningRoutesTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='planningtest',
            email='planningtest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Test', actif=True)
        self.employee = Employee.objects.create(
            nom='Jean Dupont',
            role='Serveur',
            initiales='JD',
            heures_semaine=35,
            salle=self.salle,
        )
        self.week_monday = date(2025, 1, 27)
        self.week_sunday = self.week_monday + timedelta(days=6)

    def test_planning_week_get(self):
        """GET /api/planning/week/ returns 200 with employees, capacity, weekStart, weekEnd, alerts."""
        r = self.client.get('/api/planning/week/', {'date': self.week_monday.isoformat()})
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        data = r.json()
        self.assertIn('employees', data)
        self.assertIn('capacity', data)
        self.assertIn('weekStart', data)
        self.assertIn('weekEnd', data)
        self.assertIn('alerts', data)
        self.assertEqual(data['weekStart'], self.week_monday.isoformat())
        self.assertEqual(data['weekEnd'], self.week_sunday.isoformat())
        self.assertIsInstance(data['capacity'], dict)
        self.assertIn('midi', data['capacity'])
        self.assertIn('soir', data['capacity'])
        self.assertIsInstance(data['alerts'], list)

    def test_planning_week_get_with_salle(self):
        """GET /api/planning/week/?salle=<id> filters employees by salle."""
        other_salle = Salle.objects.create(nom_salle='Other', actif=True)
        other_emp = Employee.objects.create(nom='Other', role='Chef', salle=other_salle)
        r = self.client.get('/api/planning/week/', {'date': self.week_monday.isoformat(), 'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        emp_ids = [e['id'] for e in r.json()['employees']]
        self.assertIn(self.employee.id, emp_ids)
        self.assertNotIn(other_emp.id, emp_ids)

    def test_planning_week_post_bulk_save(self):
        """POST /api/planning/week/ with weekStart and shifts creates shifts."""
        payload = {
            'weekStart': self.week_monday.isoformat(),
            'salle_id': self.salle.id,
            'shifts': [
                {'employee_id': self.employee.id, 'day': 0, 'type': 'Midi', 'start': '11:00', 'end': '15:00'},
                {'employee_id': self.employee.id, 'day': 1, 'type': 'Soir', 'start': '18:00', 'end': '23:00'},
            ],
        }
        r = self.client.post('/api/planning/week/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        data = r.json()
        self.assertIn('saved', data)
        self.assertEqual(data['saved'], 2)
        self.assertEqual(PlanningShift.objects.filter(employee=self.employee).count(), 2)

    def test_planning_week_get_after_save_includes_alerts(self):
        """After saving shifts, GET week returns alerts when under capacity."""
        PlanningCapacity.objects.create(
            salle=self.salle, day_of_week=0, type_shift='Midi', required_count=2
        )
        payload = {
            'weekStart': self.week_monday.isoformat(),
            'salle_id': self.salle.id,
            'shifts': [
                {'employee_id': self.employee.id, 'day': 0, 'type': 'Midi', 'start': '11:00', 'end': '15:00'},
            ],
        }
        self.client.post('/api/planning/week/', payload, format='json')
        r = self.client.get('/api/planning/week/', {'date': self.week_monday.isoformat(), 'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        alerts = r.json().get('alerts', [])
        midi_alerts = [a for a in alerts if a.get('type') == 'Midi' and a.get('day') == 0]
        self.assertGreater(len(midi_alerts), 0)
        self.assertEqual(midi_alerts[0]['required'], 2)
        self.assertEqual(midi_alerts[0]['actual'], 1)

    def test_planning_week_copy(self):
        """POST /api/planning/week/copy/ copies shifts from source week to target week."""
        PlanningShift.objects.create(
            employee=self.employee,
            date=self.week_monday,
            type_shift='Midi',
            heure_debut='11:00',
            heure_fin='15:00',
        )
        target_monday = date(2025, 2, 3)
        payload = {
            'source_date': self.week_monday.isoformat(),
            'target_date': target_monday.isoformat(),
            'salle_id': self.salle.id,
        }
        r = self.client.post('/api/planning/week/copy/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        data = r.json()
        self.assertIn('copied', data)
        self.assertEqual(data['copied'], 1)
        self.assertTrue(
            PlanningShift.objects.filter(employee=self.employee, date=target_monday).exists()
        )

    def test_employees_list_filtered_by_salle(self):
        """GET /api/employees/?salle=<id> returns only employees of that salle."""
        other_salle = Salle.objects.create(nom_salle='Other', actif=True)
        Employee.objects.create(nom='Other', role='Chef', salle=other_salle)
        r = self.client.get('/api/employees/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        ids = [e['id'] for e in results]
        self.assertIn(self.employee.id, ids)
        self.assertEqual(len(ids), 1)

    def test_planning_shifts_list_filtered_by_salle(self):
        """GET /api/planning-shifts/?salle=<id> returns only shifts of employees in that salle."""
        PlanningShift.objects.create(
            employee=self.employee,
            date=self.week_monday,
            type_shift='Midi',
            heure_debut='11:00',
            heure_fin='15:00',
        )
        other_salle = Salle.objects.create(nom_salle='Other', actif=True)
        other_emp = Employee.objects.create(nom='Other', role='Chef', salle=other_salle)
        PlanningShift.objects.create(
            employee=other_emp,
            date=self.week_monday,
            type_shift='Soir',
            heure_debut='18:00',
            heure_fin='23:00',
        )
        r = self.client.get('/api/planning-shifts/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        shift_emp_ids = [s['employee'] for s in results]
        self.assertIn(self.employee.id, shift_emp_ids)
        self.assertNotIn(other_emp.id, shift_emp_ids)

    def test_planning_week_requires_auth(self):
        """Planning week GET and POST require authentication."""
        self.client.credentials()
        r = self.client.get('/api/planning/week/', {'date': self.week_monday.isoformat()})
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        r = self.client.post('/api/planning/week/', {'weekStart': self.week_monday.isoformat(), 'shifts': []}, format='json')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_planning_week_copy_requires_auth(self):
        """Planning week copy requires authentication."""
        self.client.credentials()
        r = self.client.post(
            '/api/planning/week/copy/',
            {'source_date': self.week_monday.isoformat(), 'target_date': (self.week_monday + timedelta(days=7)).isoformat()},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_planning_capacity_crud(self):
        """GET/POST /api/planning-capacities/ and filter by salle."""
        r = self.client.get('/api/planning-capacities/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        r = self.client.post(
            '/api/planning-capacities/',
            {'salle': self.salle.id, 'day_of_week': 0, 'type_shift': 'Midi', 'required_count': 4},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.json()['required_count'], 4)
        self.assertEqual(PlanningCapacity.objects.filter(salle=self.salle).count(), 1)

    def test_planning_capacity_unique_per_salle_day_type(self):
        """Duplicate (salle, day_of_week, type_shift) returns 400."""
        PlanningCapacity.objects.create(salle=self.salle, day_of_week=1, type_shift='Soir', required_count=5)
        r = self.client.post(
            '/api/planning-capacities/',
            {'salle': self.salle.id, 'day_of_week': 1, 'type_shift': 'Soir', 'required_count': 6},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileRoutesTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='profiletest',
            email='profiletest@example.com',
            password='testpass123',
            first_name='Jean',
            last_name='Dupont',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Test', actif=True)
        self.role = Role.objects.create(nom_role='Manager')

    def test_profile_get(self):
        """GET /api/auth/profile/ returns 200 with profile fields and user email/name."""
        r = self.client.get('/api/auth/profile/')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        data = r.json()
        self.assertIn('email', data)
        self.assertEqual(data['email'], 'profiletest@example.com')
        self.assertIn('first_name', data)
        self.assertIn('last_name', data)
        self.assertIn('role', data)
        self.assertIn('salle', data)
        self.assertIn('mfa_enabled', data)

    def test_profile_patch_updates_role_and_salle(self):
        """PATCH /api/auth/profile/ updates role and salle."""
        profile = UserProfile.objects.create(user=self.user, salle=self.salle)
        r = self.client.patch('/api/auth/profile/', {'role': self.role.id, 'salle': self.salle.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        profile.refresh_from_db()
        self.assertEqual(profile.role_id, self.role.id)
        self.assertEqual(profile.salle_id, self.salle.id)

    def test_profile_patch_partial(self):
        """PATCH /api/auth/profile/ with only salle updates salle and leaves role unchanged."""
        profile = UserProfile.objects.create(user=self.user, role=self.role)
        r = self.client.patch('/api/auth/profile/', {'salle': self.salle.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.salle_id, self.salle.id)
        self.assertEqual(profile.role_id, self.role.id)

    def test_profile_requires_auth(self):
        """GET and PATCH /api/auth/profile/ require authentication."""
        self.client.credentials()
        r = self.client.get('/api/auth/profile/')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        r = self.client.patch('/api/auth/profile/', {'salle': 1}, format='json')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class ReservationRoutesTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='restest',
            email='restest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle A', actif=True)
        self.other_salle = Salle.objects.create(nom_salle='Salle B', actif=True)
        self.client_entity = Client.objects.create(
            nom_client='Dupont',
            prenom_client='Marie',
            salle=self.salle,
        )
        self.res_today = Reservation.objects.create(
            client=self.client_entity,
            salle=self.salle,
            date_reservation=date.today(),
            heure_reservation=time(12, 0),
            nombre_personnes=2,
            statut_reservation='confirmed',
        )
        self.res_future = Reservation.objects.create(
            client=self.client_entity,
            salle=self.salle,
            date_reservation=date(2025, 2, 15),
            heure_reservation=time(19, 0),
            nombre_personnes=4,
            statut_reservation='pending',
        )

    def test_reservations_today(self):
        """GET /api/reservations/today/ returns today's reservations."""
        r = self.client.get('/api/reservations/today/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertIsInstance(data, list)
        # Without salle filter we get all; with salle we filter. Here we have no profile salle so all.
        self.assertGreaterEqual(len(data), 1)
        ids = [x['id'] for x in data]
        self.assertIn(self.res_today.id, ids)

    def test_reservations_today_with_salle(self):
        """GET /api/reservations/today/?salle= returns only that salle's reservations."""
        Reservation.objects.create(
            client=self.client_entity,
            salle=self.other_salle,
            date_reservation=date.today(),
            heure_reservation=time(13, 0),
            nombre_personnes=2,
            statut_reservation='pending',
        )
        r = self.client.get('/api/reservations/today/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        for item in data:
            self.assertEqual(item['salle'], self.salle.id)

    def test_reservations_by_date(self):
        """GET /api/reservations/by-date/?date=YYYY-MM-DD returns reservations for that date."""
        r = self.client.get('/api/reservations/by-date/', {'date': '2025-02-15'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.res_future.id)

    def test_reservations_by_date_requires_date(self):
        """GET /api/reservations/by-date/ without date returns 400."""
        r = self.client.get('/api/reservations/by-date/')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', r.json() or {})

    def test_reservations_list_filtered_by_salle(self):
        """GET /api/reservations/?salle= returns only that salle's reservations."""
        r = self.client.get('/api/reservations/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertIsInstance(results, list)
        for item in results:
            self.assertEqual(item['salle'], self.salle.id)
        res_ids = [x['id'] for x in results]
        self.assertIn(self.res_today.id, res_ids)
        self.assertIn(self.res_future.id, res_ids)

    def test_reservations_filters_statut_client_date(self):
        """GET /api/reservations/?statut= & ?client= & ?date_from= & ?date_to=."""
        r = self.client.get('/api/reservations/', {'statut': 'confirmed'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.json().get('results', r.json())
        for item in results:
            self.assertEqual(item['statut_reservation'], 'confirmed')
        r = self.client.get('/api/reservations/', {'client': self.client_entity.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        r = self.client.get('/api/reservations/', {'date_from': '2025-02-01', 'date_to': '2025-02-28'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.json().get('results', r.json())
        self.assertGreaterEqual(len(results), 1)

    def test_reservation_detail_inclut_canal_et_tables(self):
        """GET /api/reservations/<id>/ renvoie canal et tables."""
        self.res_today.canal = 'site'
        self.res_today.save()
        r = self.client.get(f'/api/reservations/{self.res_today.id}/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json().get('canal'), 'site')
        self.assertIn('tables', r.json())
        self.assertEqual(r.json()['tables'], [])

    def test_reservation_confirmer_annuler_marquer_arrivee(self):
        """POST confirmer, annuler, marquer-arrivee mettent à jour le statut."""
        r = self.client.post(f'/api/reservations/{self.res_future.id}/confirmer/', format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.res_future.refresh_from_db()
        self.assertEqual(self.res_future.statut_reservation, 'confirmed')
        r = self.client.post(f'/api/reservations/{self.res_future.id}/marquer-arrivee/', format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.res_future.refresh_from_db()
        self.assertEqual(self.res_future.statut_reservation, 'arrived')
        r = self.client.post(f'/api/reservations/{self.res_today.id}/annuler/', format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.res_today.refresh_from_db()
        self.assertEqual(self.res_today.statut_reservation, 'cancelled')

    def test_reservation_tables_add_remove(self):
        """GET/POST/DELETE /api/reservations/<id>/tables/."""
        table = Table.objects.create(numero_table='T1', capacite_table=4, salle=self.salle)
        r = self.client.get(f'/api/reservations/{self.res_today.id}/tables/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json(), [])
        r = self.client.post(f'/api/reservations/{self.res_today.id}/tables/', {'table': table.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        r = self.client.get(f'/api/reservations/{self.res_today.id}/tables/')
        self.assertEqual(len(r.json()), 1)
        self.assertEqual(r.json()[0]['id'], table.id)
        r = self.client.delete(f'/api/reservations/{self.res_today.id}/tables/?table={table.id}')
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Detail_Reservation_Table.objects.filter(reservation=self.res_today).count(), 0)

    def test_reservation_creneaux_disponibles(self):
        """GET /api/reservations/creneaux-disponibles/?date= &salle= retourne créneaux."""
        r = self.client.get('/api/reservations/creneaux-disponibles/', {'date': '2025-06-01', 'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertIn('creneaux', data)
        self.assertIn('date', data)
        self.assertTrue(isinstance(data['creneaux'], list))
        if data['creneaux']:
            self.assertIn('heure', data['creneaux'][0])
            self.assertIn('tables_disponibles', data['creneaux'][0])

    def test_reservation_validate_client_salle(self):
        """Création résa avec client d'une autre salle refusée."""
        client_other = Client.objects.create(nom_client='X', prenom_client='Y', salle=self.other_salle)
        r = self.client.post(
            '/api/reservations/',
            {
                'client': client_other.id,
                'salle': self.salle.id,
                'date_reservation': '2025-07-01',
                'heure_reservation': '12:00:00',
                'nombre_personnes': 2,
                'statut_reservation': 'pending',
                'statutType': 'pending',
            },
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('client', r.json())


class StockRoutesTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='stocktest',
            email='stocktest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Stock', actif=True)
        self.categorie = Categorie_Produit.objects.create(
            nom_categorie_produit='Boissons',
            salle=self.salle,
        )
        self.produit = Produit.objects.create(
            nom_produit='Eau minérale',
            categorie=self.categorie,
            salle=self.salle,
            stock_produit=10,
        )

    def test_produit_stock_patch_quantity(self):
        """PATCH /api/produits/<id>/stock/ with quantity sets stock."""
        r = self.client.patch(
            f'/api/produits/{self.produit.id}/stock/',
            {'quantity': 25},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json()['stock_produit'], 25)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock_produit, 25)

    def test_produit_stock_patch_delta(self):
        """PATCH /api/produits/<id>/stock/ with delta adjusts stock."""
        r = self.client.patch(
            f'/api/produits/{self.produit.id}/stock/',
            {'delta': -3},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json()['stock_produit'], 7)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock_produit, 7)

    def test_produit_stock_patch_negative_rejected(self):
        """PATCH stock with quantity or delta leading to negative returns 400."""
        r = self.client.patch(
            f'/api/produits/{self.produit.id}/stock/',
            {'quantity': -1},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        r = self.client.patch(
            f'/api/produits/{self.produit.id}/stock/',
            {'delta': -100},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stock_movement_list(self):
        """GET /api/product-stock-movements/ returns list (product stock, not ingredients)."""
        r = self.client.get('/api/product-stock-movements/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertIsInstance(results, list)

    def test_stock_movement_create_updates_product(self):
        """POST /api/product-stock-movements/ creates movement and updates product stock."""
        payload = {
            'produit': self.produit.id,
            'quantity_delta': 5,
            'notes': 'Réception livraison',
        }
        r = self.client.post('/api/product-stock-movements/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock_produit, 15)
        self.assertEqual(StockMovement.objects.filter(produit=self.produit).count(), 1)

    def test_stock_movement_create_negative_delta(self):
        """POST stock-movement with negative delta decreases stock (clamped to 0)."""
        payload = {'produit': self.produit.id, 'quantity_delta': -4}
        r = self.client.post('/api/product-stock-movements/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock_produit, 6)

    def test_stock_movement_filter_by_produit(self):
        """GET /api/product-stock-movements/?produit=<id> filters by product."""
        StockMovement.objects.create(produit=self.produit, quantity_delta=2, user=self.user)
        other_cat = Categorie_Produit.objects.create(nom_categorie_produit='Autre', salle=self.salle)
        other_produit = Produit.objects.create(
            nom_produit='Autre',
            categorie=other_cat,
            salle=self.salle,
            stock_produit=0,
        )
        StockMovement.objects.create(produit=other_produit, quantity_delta=1, user=self.user)
        r = self.client.get('/api/product-stock-movements/', {'produit': self.produit.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['produit'], self.produit.id)

    def test_stock_movement_requires_auth(self):
        """Product stock movements list and create require authentication."""
        self.client.credentials()
        r = self.client.get('/api/product-stock-movements/')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        r = self.client.post(
            '/api/product-stock-movements/',
            {'produit': self.produit.id, 'quantity_delta': 1},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class IngredientStockRoutesTest(TestCase):
    """Stock logic for ingredients (kitchen stock)."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ingredienttest',
            email='ingredienttest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Cuisine', actif=True)
        self.ingredient = Ingredient.objects.create(
            nom_ingredient='Farine',
            unite='kg',
            stock_actuel=Decimal('10.000'),
            salle=self.salle,
        )

    def test_ingredient_list_and_create(self):
        """GET /api/stock/ and POST /api/stock/ work with salle filter (stock = ingredients)."""
        r = self.client.get('/api/stock/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['nom_ingredient'], 'Farine')
        r = self.client.post(
            '/api/stock/',
            {'nom_ingredient': 'Beurre', 'unite': 'kg', 'stock_actuel': '5', 'salle': self.salle.id},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ingredient.objects.filter(salle=self.salle).count(), 2)

    def test_ingredient_stock_patch_quantity(self):
        """PATCH /api/stock/<id>/stock/ with quantity sets stock."""
        r = self.client.patch(
            f'/api/stock/{self.ingredient.id}/stock/',
            {'quantity': '25.5'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(r.json()['stock_actuel']), Decimal('25.5'))
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.stock_actuel, Decimal('25.5'))

    def test_ingredient_stock_patch_delta(self):
        """PATCH /api/stock/<id>/stock/ with delta adjusts stock."""
        r = self.client.patch(
            f'/api/stock/{self.ingredient.id}/stock/',
            {'delta': '-3.5'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(r.json()['stock_actuel']), Decimal('6.5'))
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.stock_actuel, Decimal('6.5'))

    def test_ingredient_stock_patch_negative_rejected(self):
        """PATCH stock leading to negative returns 400."""
        r = self.client.patch(
            f'/api/stock/{self.ingredient.id}/stock/',
            {'quantity': '-1'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        r = self.client.patch(
            f'/api/stock/{self.ingredient.id}/stock/',
            {'delta': '-100'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ingredient_movement_create_updates_stock(self):
        """POST /api/stock-movements/ creates movement and updates stock (ingredients)."""
        payload = {
            'ingredient': self.ingredient.id,
            'quantity_delta': '5.000',
            'notes': 'Livraison',
        }
        r = self.client.post('/api/stock-movements/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.stock_actuel, Decimal('15.000'))
        self.assertEqual(IngredientMovement.objects.filter(ingredient=self.ingredient).count(), 1)

    def test_ingredient_movement_negative_delta(self):
        """POST stock-movement with negative delta decreases stock."""
        payload = {'ingredient': self.ingredient.id, 'quantity_delta': '-4.000'}
        r = self.client.post('/api/stock-movements/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.stock_actuel, Decimal('6.000'))

    def test_ingredient_movement_list_and_filter(self):
        """GET /api/stock-movements/?ingredient=<id> filters by ingredient."""
        IngredientMovement.objects.create(ingredient=self.ingredient, quantity_delta=Decimal('2'), user=self.user)
        other = Ingredient.objects.create(nom_ingredient='Sel', unite='kg', stock_actuel=Decimal('1'), salle=self.salle)
        IngredientMovement.objects.create(ingredient=other, quantity_delta=Decimal('1'), user=self.user)
        r = self.client.get('/api/stock-movements/', {'ingredient': self.ingredient.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['ingredient'], self.ingredient.id)

    def test_ingredient_routes_require_auth(self):
        """Stock and stock-movements require authentication."""
        self.client.credentials()
        r = self.client.get('/api/stock/')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        r = self.client.post(
            '/api/stock-movements/',
            {'ingredient': self.ingredient.id, 'quantity_delta': '1'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class FacturationLogicTest(TestCase):
    """Logique facturation : creer-facture depuis commande, montant_paye, statut mis à jour par paiements."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='factutest',
            email='factutest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Test', actif=True)
        self.client_entity = Client.objects.create(
            nom_client='Dupont', prenom_client='Jean', salle=self.salle,
        )
        self.commande = Commande.objects.create(
            salle=self.salle,
            client=self.client_entity,
            total_commande=Decimal('50.00'),
            statut_commande='open',
        )

    def test_creer_facture_from_commande(self):
        """POST /api/commandes/<id>/creer-facture/ crée une facture avec montant = total_commande."""
        r = self.client.post(f'/api/commandes/{self.commande.id}/creer-facture/', format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        data = r.json()
        self.assertEqual(Decimal(str(data['montant_total'])), Decimal('50.00'))
        self.assertEqual(data['statut_facture'], 'unpaid')
        self.assertEqual(data['commande'], self.commande.id)
        self.assertTrue(Facture.objects.filter(commande=self.commande).exists())

    def test_creer_facture_idempotent(self):
        """Créer une facture deux fois renvoie 400."""
        self.client.post(f'/api/commandes/{self.commande.id}/creer-facture/', format='json')
        r = self.client.post(f'/api/commandes/{self.commande.id}/creer-facture/', format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_facture_montant_paye_et_reste(self):
        """GET facture renvoie montant_paye et reste_a_payer."""
        facture = Facture.objects.create(
            commande=self.commande,
            client=self.client_entity,
            salle=self.salle,
            montant_total=Decimal('100.00'),
            statut_facture='unpaid',
        )
        r = self.client.get(f'/api/factures/{facture.id}/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(r.json()['montant_paye'])), Decimal('0'))
        self.assertEqual(Decimal(str(r.json()['reste_a_payer'])), Decimal('100.00'))

    def test_paiement_recalcule_statut_facture(self):
        """Ajouter un paiement complet met la facture en paid."""
        facture = Facture.objects.create(
            commande=self.commande,
            client=self.client_entity,
            salle=self.salle,
            montant_total=Decimal('30.00'),
            statut_facture='unpaid',
        )
        r = self.client.post(
            '/api/paiements/',
            {'facture': facture.id, 'montant_paiement': '30.00', 'mode_paiement': 'card'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        facture.refresh_from_db()
        self.assertEqual(facture.statut_facture, 'paid')

    def test_creer_facture_montant_depuis_lignes(self):
        """creer-facture utilise la somme des total_ligne si la commande a des lignes."""
        Ligne_Commande.objects.create(
            commande=self.commande,
            quantite=2,
            prix_unitaire=Decimal('10.00'),
            total_ligne=Decimal('20.00'),
            type_element='plat',
        )
        Ligne_Commande.objects.create(
            commande=self.commande,
            quantite=1,
            prix_unitaire=Decimal('15.00'),
            total_ligne=Decimal('15.00'),
            type_element='produit',
        )
        self.commande.recalculer_total_commande()
        r = self.client.post(f'/api/commandes/{self.commande.id}/creer-facture/', format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(r.json()['montant_total'])), Decimal('35.00'))

    def test_recalculer_montant_facture(self):
        """POST /api/factures/<id>/recalculer-montant/ met à jour montant_total depuis les lignes."""
        facture = Facture.objects.create(
            commande=self.commande,
            client=self.client_entity,
            salle=self.salle,
            montant_total=Decimal('99.00'),
            statut_facture='unpaid',
        )
        Ligne_Commande.objects.create(
            commande=self.commande,
            quantite=1,
            prix_unitaire=Decimal('25.00'),
            total_ligne=Decimal('25.00'),
            type_element='plat',
        )
        r = self.client.post(f'/api/factures/{facture.id}/recalculer-montant/', format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(r.json()['montant_total'])), Decimal('25.00'))
        facture.refresh_from_db()
        self.assertEqual(facture.montant_total, Decimal('25.00'))

    def test_facture_paid_met_commande_paid(self):
        """Quand la facture passe en paid, la commande passe en paid."""
        facture = Facture.objects.create(
            commande=self.commande,
            client=self.client_entity,
            salle=self.salle,
            montant_total=Decimal('20.00'),
            statut_facture='unpaid',
        )
        self.assertEqual(self.commande.statut_commande, 'open')
        self.client.post(
            '/api/paiements/',
            {'facture': facture.id, 'montant_paiement': '20.00', 'mode_paiement': 'cash'},
            format='json',
        )
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.statut_commande, 'paid')

    def test_historique_commandes_inclut_facture(self):
        """GET /api/commandes/ et /api/commandes/historique/ renvoient facture (résumé) pour chaque commande."""
        from .models import UserProfile
        facture = Facture.objects.create(
            commande=self.commande,
            client=self.client_entity,
            salle=self.salle,
            montant_total=Decimal('50.00'),
            statut_facture='unpaid',
        )
        profile, _ = UserProfile.objects.get_or_create(user=self.user)
        profile.salle = self.salle
        profile.save()
        r = self.client.get(f'/api/commandes/{self.commande.id}/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertIn('facture', data)
        self.assertIsNotNone(data['facture'])
        self.assertEqual(data['facture']['id'], facture.id)
        self.assertEqual(Decimal(str(data['facture']['montant_total'])), Decimal('50.00'))
        self.assertIn('montant_paye', data['facture'])
        self.assertIn('reste_a_payer', data['facture'])
        r2 = self.client.get('/api/commandes/historique/', {'salle': self.salle.id})
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        resp = r2.json()
        results = resp.get('results', resp) if isinstance(resp, dict) else resp
        if not isinstance(results, list):
            results = [resp]
        self.assertGreaterEqual(len(results), 1)
        cmd = next((c for c in results if c.get('id') == self.commande.id), None)
        self.assertIsNotNone(cmd, f'Commande {self.commande.id} not in list: {results}')
        self.assertIn('facture', cmd)
        self.assertIsNotNone(cmd['facture'], f'facture is None for commande: {cmd}')

    def test_commandes_stats(self):
        """GET /api/commandes/stats/ renvoie agrégats (total_commandes, total_ca, par statut, factures)."""
        Facture.objects.create(
            commande=self.commande,
            client=self.client_entity,
            salle=self.salle,
            montant_total=Decimal('50.00'),
            statut_facture='unpaid',
        )
        r = self.client.get('/api/commandes/stats/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertIn('total_commandes', data)
        self.assertIn('total_ca', data)
        self.assertIn('par_statut_commande', data)
        self.assertIn('avec_facture', data)
        self.assertIn('facture_payee', data)
        self.assertIn('facture_impayee', data)
        self.assertGreaterEqual(data['total_commandes'], 1)
        self.assertGreaterEqual(data['avec_facture'], 1)


class MenuPlatsTest(TestCase):
    """Menus : ajouter / retirer des plats via l'API."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='menutest',
            email='menutest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Test', actif=True)
        self.menu = Menu.objects.create(nom_menu='Carte midi', salle=self.salle, actif=True)
        self.plat1 = Plat.objects.create(
            nom_plat='Salade',
            prix_plat=Decimal('12.00'),
            salle=self.salle,
        )
        self.plat2 = Plat.objects.create(
            nom_plat='Steak',
            prix_plat=Decimal('18.00'),
            salle=self.salle,
        )

    def test_menu_detail_inclut_plats(self):
        """GET /api/menus/<id>/ renvoie la liste des plats du menu."""
        Appartenance_Menu_Plat.objects.create(menu=self.menu, plat=self.plat1)
        r = self.client.get(f'/api/menus/{self.menu.id}/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('plats', r.json())
        self.assertEqual(len(r.json()['plats']), 1)
        self.assertEqual(r.json()['plats'][0]['nom_plat'], 'Salade')

    def test_menu_plats_get_post_delete(self):
        """GET /api/menus/<id>/plats/ liste ; POST ajoute ; DELETE retire."""
        r = self.client.get(f'/api/menus/{self.menu.id}/plats/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json(), [])
        r = self.client.post(f'/api/menus/{self.menu.id}/plats/', {'plat': self.plat1.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        r = self.client.get(f'/api/menus/{self.menu.id}/plats/')
        self.assertEqual(len(r.json()), 1)
        self.assertEqual(r.json()[0]['id'], self.plat1.id)
        r = self.client.delete(f'/api/menus/{self.menu.id}/plats/?plat={self.plat1.id}')
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        r = self.client.get(f'/api/menus/{self.menu.id}/plats/')
        self.assertEqual(r.json(), [])

    def test_menu_add_plat_idempotent(self):
        """Ajouter deux fois le même plat renvoie 200 et message."""
        self.client.post(f'/api/menus/{self.menu.id}/plats/', {'plat': self.plat1.id}, format='json')
        r = self.client.post(f'/api/menus/{self.menu.id}/plats/', {'plat': self.plat1.id}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('déjà', r.json().get('detail', ''))


class CommandeFournisseurRoutesTest(TestCase):
    """Commandes fournisseur: create order, add lines, marquer comme livrée → stock movements."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='fournisseurtest',
            email='fournisseurtest@example.com',
            password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.salle = Salle.objects.create(nom_salle='Salle Test', actif=True)
        self.fournisseur = Fournisseur.objects.create(
            nom='Ferme Bio',
            email='contact@fermebio.fr',
            salle=self.salle,
        )
        self.ingredient = Ingredient.objects.create(
            nom_ingredient='Farine',
            unite='kg',
            stock_actuel=Decimal('5.000'),
            salle=self.salle,
        )

    def test_fournisseur_crud(self):
        """GET/POST /api/fournisseurs/ with salle filter."""
        r = self.client.get('/api/fournisseurs/', {'salle': self.salle.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        r = self.client.post(
            '/api/fournisseurs/',
            {'nom': 'Primeur du marché', 'salle': self.salle.id},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Fournisseur.objects.filter(salle=self.salle).count(), 2)

    def test_commande_fournisseur_create_with_lignes(self):
        """Create supplier order then add lines; salle is set from fournisseur."""
        r = self.client.post(
            '/api/commandes-fournisseur/',
            {'fournisseur': self.fournisseur.id, 'statut': 'brouillon'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        cmd_id = r.json()['id']
        self.assertEqual(r.json()['salle'], self.salle.id)
        r2 = self.client.post(
            '/api/lignes-commande-fournisseur/',
            {'commande': cmd_id, 'ingredient': self.ingredient.id, 'quantite': '10.000'},
            format='json',
        )
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LigneCommandeFournisseur.objects.filter(commande_id=cmd_id).count(), 1)

    def test_marquer_comme_livree_creates_stock_movements(self):
        """POST marquer-comme-livree creates IngredientMovements and updates ingredient stock."""
        commande = CommandeFournisseur.objects.create(
            fournisseur=self.fournisseur,
            salle=self.salle,
            statut='envoyee',
        )
        LigneCommandeFournisseur.objects.create(
            commande=commande,
            ingredient=self.ingredient,
            quantite=Decimal('20'),
        )
        self.assertEqual(self.ingredient.stock_actuel, Decimal('5.000'))
        r = self.client.post(
            f'/api/commandes-fournisseur/{commande.id}/marquer-comme-livree/',
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json()['statut'], 'livree')
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.stock_actuel, Decimal('25.000'))
        self.assertEqual(IngredientMovement.objects.filter(ingredient=self.ingredient).count(), 1)
