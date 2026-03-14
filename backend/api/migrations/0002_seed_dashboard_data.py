# Generated manually - seed default dashboard data

from django.db import migrations


def seed_reservations(apps, schema_editor):
    Reservation = apps.get_model('api', 'Reservation')
    if Reservation.objects.exists():
        return
    data = [
        ('Martin Dupont', '12:30', 4, 'Site', 'Confirmée', 'confirmed'),
        ('Sophie Bernard', '13:00', 2, 'Téléphone', 'Arrivée', 'arrived'),
        ('Jean Moreau', '19:30', 6, 'TheFork', 'Confirmée', 'confirmed'),
        ('Marie Leclerc', '20:00', 3, 'Site', 'En Attente', 'pending'),
        ('Pierre Dubois', '20:30', 2, 'Téléphone', 'Confirmée', 'confirmed'),
    ]
    for client, heure, couverts, canal, statut, statut_type in data:
        Reservation.objects.create(
            client=client, heure=heure, couverts=couverts, canal=canal,
            statut=statut, statut_type=statut_type
        )


def seed_supplier_orders(apps, schema_editor):
    SupplierOrder = apps.get_model('api', 'SupplierOrder')
    if SupplierOrder.objects.exists():
        return
    data = [
        ('Filet de bœuf', 'Boucherie Moderne', '28.90 €/kg', '-2.3%', 'down', 'Faible', 'low', '3j'),
        ('Saumon frais', 'Océan Frais', '22.50 €/kg', '+5.1%', 'up', 'Moyen', 'medium', '1j'),
        ('Tomates bio', 'Potager Local', '3.20 €/kg', '-0.8%', 'down', 'Bon', 'good', '2j'),
        ("Huile d'olive", 'Epicerie Fine', '18.90 €/L', '+1.2%', 'up', 'Bon', 'good', '5j'),
        ('Vin rouge AOC', 'Cave Sélection', '12.40 €/btl', '0%', 'neutral', 'Faible', 'low', '7j'),
    ]
    for produit, fournisseur, prix, variation, variation_type, stock, stock_type, derniere_cmd in data:
        SupplierOrder.objects.create(
            produit=produit, fournisseur=fournisseur, prix=prix, variation=variation,
            variation_type=variation_type, stock=stock, stock_type=stock_type, derniere_cmd=derniere_cmd
        )


def seed_team_shifts(apps, schema_editor):
    TeamShift = apps.get_model('api', 'TeamShift')
    if TeamShift.objects.exists():
        return
    data = [
        ('11:00', 'Chef de rang', 'Alice M.', 'assigned'),
        ('11:00', 'Serveur', 'Thomas L.', 'assigned'),
        ('12:00', 'Serveur', 'Julie P.', 'assigned'),
        ('18:00', 'Chef de rang', 'Marc D.', 'assigned'),
        ('18:00', 'Serveur', 'Sophie B.', 'unassigned'),
        ('19:00', 'Serveur', 'Non assigné', 'unassigned'),
    ]
    for time, role, name, status in data:
        TeamShift.objects.create(time=time, role=role, name=name, status=status)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_add_reservation_supplier_team_models'),
    ]

    operations = [
        migrations.RunPython(seed_reservations, reverse_noop),
        migrations.RunPython(seed_supplier_orders, reverse_noop),
        migrations.RunPython(seed_team_shifts, reverse_noop),
    ]
