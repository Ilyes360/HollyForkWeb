from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def api_root(request):
    """
    API root endpoint
    """
    return Response({
        'message': 'Welcome to the API',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def dashboard_data(request):
    """
    Dashboard data endpoint
    """
    data = {
        'kpis': [
            {
                'title': 'CA JOUR',
                'value': '3 245 €',
                'trend': 'up',
                'trendValue': '+12% vs hier',
            },
            {
                'title': 'CA MOIS',
                'value': '78 340 €',
                'trend': 'up',
                'trendValue': '+8% vs M-1',
            },
            {
                'title': 'TAUX DE REMPLISSAGE',
                'value': '87%',
                'trend': 'up',
                'trendValue': '+5%',
                'details': [
                    {'label': 'Midi', 'value': '92%'},
                    {'label': 'Soir', 'value': '82%'},
                ],
            },
            {
                'title': 'COUVERTS',
                'value': '142',
                'trend': 'down',
                'trendValue': '-3%',
                'details': [
                    {'label': 'Semaine', 'value': '896'},
                ],
            },
            {
                'title': 'FOOD COST',
                'value': '28.5%',
                'trend': 'up',
                'trendValue': '+1.2%',
                'objective': '27%',
            },
            {
                'title': 'SATISFACTION',
                'value': '4.6/5',
                'trend': 'up',
                'trendValue': '+0.2',
                'reviews': '47',
            },
        ],
        'mapStats': {
            'establishments': 3,
            'suppliers': 12,
            'averageDelay': '2.4h',
        },
        'salesByCategory': [
            {'name': 'Plats', 'amount': '1,460 €', 'percentage': 100},
            {'name': 'Boissons', 'amount': '812 €', 'percentage': 56},
            {'name': 'Entrées', 'amount': '584 €', 'percentage': 40},
            {'name': 'Desserts', 'amount': '389 €', 'percentage': 27},
        ],
        'trendData': [
            {'day': 'Lun', 'value': 45},
            {'day': 'Mar', 'value': 48},
            {'day': 'Mer', 'value': 50},
            {'day': 'Jeu', 'value': 55},
            {'day': 'Ven', 'value': 65},
            {'day': 'Sam', 'value': 85},
            {'day': 'Dim', 'value': 80},
        ],
        'teamPlanning': {
            'shifts': [
                {'time': '11:00', 'role': 'Chef de rang', 'name': 'Alice M.', 'status': 'assigned'},
                {'time': '11:00', 'role': 'Serveur', 'name': 'Thomas L.', 'status': 'assigned'},
                {'time': '12:00', 'role': 'Serveur', 'name': 'Julie P.', 'status': 'assigned'},
                {'time': '18:00', 'role': 'Chef de rang', 'name': 'Marc D.', 'status': 'assigned'},
                {'time': '18:00', 'role': 'Serveur', 'name': 'Sophie B.', 'status': 'unassigned'},
                {'time': '19:00', 'role': 'Serveur', 'name': 'Non assigné', 'status': 'unassigned'},
            ],
        },
        'reservations': [
            {'client': 'Martin Dupont', 'heure': '12:30', 'couverts': 4, 'canal': 'Site', 'statut': 'Confirmée', 'statutType': 'confirmed'},
            {'client': 'Sophie Bernard', 'heure': '13:00', 'couverts': 2, 'canal': 'Téléphone', 'statut': 'Arrivée', 'statutType': 'arrived'},
            {'client': 'Jean Moreau', 'heure': '19:30', 'couverts': 6, 'canal': 'TheFork', 'statut': 'Confirmée', 'statutType': 'confirmed'},
            {'client': 'Marie Leclerc', 'heure': '20:00', 'couverts': 3, 'canal': 'Site', 'statut': 'En Attente', 'statutType': 'pending'},
            {'client': 'Pierre Dubois', 'heure': '20:30', 'couverts': 2, 'canal': 'Téléphone', 'statut': 'Confirmée', 'statutType': 'confirmed'},
        ],
        'supplierOrders': [
            {
                'produit': 'Filet de bœuf',
                'fournisseur': 'Boucherie Moderne',
                'prix': '28.90 €/kg',
                'variation': '-2.3%',
                'variationType': 'down',
                'stock': 'Faible',
                'stockType': 'low',
                'derniereCmd': '3j',
            },
            {
                'produit': 'Saumon frais',
                'fournisseur': 'Océan Frais',
                'prix': '22.50 €/kg',
                'variation': '+5.1%',
                'variationType': 'up',
                'stock': 'Moyen',
                'stockType': 'medium',
                'derniereCmd': '1j',
            },
            {
                'produit': 'Tomates bio',
                'fournisseur': 'Potager Local',
                'prix': '3.20 €/kg',
                'variation': '-0.8%',
                'variationType': 'down',
                'stock': 'Bon',
                'stockType': 'good',
                'derniereCmd': '2j',
            },
            {
                'produit': 'Huile d\'olive',
                'fournisseur': 'Epicerie Fine',
                'prix': '18.90 €/L',
                'variation': '+1.2%',
                'variationType': 'up',
                'stock': 'Bon',
                'stockType': 'good',
                'derniereCmd': '5j',
            },
            {
                'produit': 'Vin rouge AOC',
                'fournisseur': 'Cave Sélection',
                'prix': '12.40 €/btl',
                'variation': '0%',
                'variationType': 'neutral',
                'stock': 'Faible',
                'stockType': 'low',
                'derniereCmd': '7j',
            },
        ],
    }
    return Response(data, status=status.HTTP_200_OK)

