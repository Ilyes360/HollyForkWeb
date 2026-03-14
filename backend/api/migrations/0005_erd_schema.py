# Migration: full ERD schema (Salle, Role, Table, Client, Reservation, Commande, etc.)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_add_mfa_models'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ─── Core ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Salle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_salle', models.CharField(max_length=255)),
                ('adresse_salle', models.CharField(blank=True, max_length=500)),
                ('telephone_salle', models.CharField(blank=True, max_length=50)),
                ('email_salle', models.EmailField(blank=True, max_length=254)),
                ('description_salle', models.TextField(blank=True)),
                ('actif', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['nom_salle']},
        ),
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_role', models.CharField(max_length=100)),
                ('description_role', models.TextField(blank=True)),
                ('salle', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='roles', to='api.salle')),
            ],
            options={'ordering': ['nom_role']},
        ),
        # UserProfile: add role, salle
        migrations.AddField(
            model_name='userprofile',
            name='role',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='api.role'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='salle',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='api.salle'),
        ),
        # TempLoginToken: add expires_at
        migrations.AddField(
            model_name='templogintoken',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        # ─── Venue layout ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='Table',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_table', models.CharField(max_length=50)),
                ('capacite_table', models.PositiveSmallIntegerField(default=2)),
                ('type_table', models.CharField(choices=[('carrée', 'Carrée'), ('rectangulaire', 'Rectangulaire'), ('ronde', 'Ronde')], default='carrée', max_length=20)),
                ('x_position', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('y_position', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('rotation', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('width', models.DecimalField(decimal_places=2, default=60, max_digits=10)),
                ('height', models.DecimalField(decimal_places=2, default=60, max_digits=10)),
                ('radius', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('actif', models.BooleanField(default=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tables', to='api.salle')),
            ],
            options={'ordering': ['numero_table'], 'unique_together': {('salle', 'numero_table')}},
        ),
        migrations.CreateModel(
            name='Zone_Verdure',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_verdure', models.CharField(choices=[('round', 'Rond'), ('line', 'Ligne')], max_length=20)),
                ('points_verdure', models.JSONField(default=list)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='zones_verdure', to='api.salle')),
            ],
            options={'ordering': ['id']},
        ),
        migrations.CreateModel(
            name='Mur',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('points_mur', models.JSONField(default=list)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='murs', to='api.salle')),
            ],
            options={'ordering': ['id']},
        ),
        # ─── Menu & dishes ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='Groupe_Menu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_groupe_menu', models.CharField(max_length=200)),
                ('description_groupe_menu', models.TextField(blank=True)),
                ('actif', models.BooleanField(default=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='groupes_menu', to='api.salle')),
            ],
            options={'ordering': ['nom_groupe_menu']},
        ),
        migrations.CreateModel(
            name='Menu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_menu', models.CharField(max_length=200)),
                ('description_menu', models.TextField(blank=True)),
                ('actif', models.BooleanField(default=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='menus', to='api.salle')),
            ],
            options={'ordering': ['nom_menu']},
        ),
        migrations.CreateModel(
            name='Plat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_plat', models.CharField(max_length=200)),
                ('description_plat', models.TextField(blank=True)),
                ('prix_plat', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('actif', models.BooleanField(default=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plats', to='api.salle')),
            ],
            options={'ordering': ['nom_plat']},
        ),
        migrations.CreateModel(
            name='Formule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_formule', models.CharField(max_length=200)),
                ('description_formule', models.TextField(blank=True)),
                ('prix_formule', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('actif', models.BooleanField(default=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='formules', to='api.salle')),
            ],
            options={'ordering': ['nom_formule']},
        ),
        migrations.CreateModel(
            name='Appartenance_Groupe_Menu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('groupe_menu', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.groupe_menu')),
                ('menu', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.menu')),
            ],
            options={'unique_together': {('groupe_menu', 'menu')}},
        ),
        migrations.CreateModel(
            name='Appartenance_Menu_Plat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('menu', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.menu')),
                ('plat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.plat')),
            ],
            options={'unique_together': {('menu', 'plat')}},
        ),
        migrations.CreateModel(
            name='Appartenance_Formule_Menu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('formule', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.formule')),
                ('menu', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.menu')),
            ],
            options={'unique_together': {('formule', 'menu')}},
        ),
        # ─── Products ────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Categorie_Produit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_categorie_produit', models.CharField(max_length=200)),
                ('description_categorie_produit', models.TextField(blank=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categories_produit', to='api.salle')),
            ],
            options={'ordering': ['nom_categorie_produit']},
        ),
        migrations.CreateModel(
            name='Produit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_produit', models.CharField(max_length=200)),
                ('description_produit', models.TextField(blank=True)),
                ('prix_unitaire_produit', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('actif', models.BooleanField(default=True)),
                ('stock_produit', models.PositiveIntegerField(default=0)),
                ('categorie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='produits', to='api.categorie_produit')),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='produits', to='api.salle')),
            ],
            options={'ordering': ['nom_produit']},
        ),
        # ─── Client & reservations ───────────────────────────────────────────
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_client', models.CharField(max_length=200)),
                ('prenom_client', models.CharField(max_length=200)),
                ('email_client', models.EmailField(blank=True, max_length=254)),
                ('telephone_client', models.CharField(blank=True, max_length=50)),
                ('adresse_client', models.CharField(blank=True, max_length=500)),
                ('code_postal_client', models.CharField(blank=True, max_length=20)),
                ('ville_client', models.CharField(blank=True, max_length=100)),
                ('pays_client', models.CharField(blank=True, max_length=100)),
                ('date_naissance_client', models.DateField(blank=True, null=True)),
                ('actif', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='clients', to='api.salle')),
            ],
            options={'ordering': ['nom_client', 'prenom_client']},
        ),
        # Replace old Reservation with ERD Reservation
        migrations.DeleteModel(name='Reservation'),
        migrations.CreateModel(
            name='Reservation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_reservation', models.DateField()),
                ('heure_reservation', models.TimeField()),
                ('nombre_personnes', models.PositiveSmallIntegerField(default=2)),
                ('statut_reservation', models.CharField(choices=[('pending', 'En attente'), ('confirmed', 'Confirmée'), ('cancelled', 'Annulée'), ('arrived', 'Arrivée')], default='pending', max_length=20)),
                ('notes_reservation', models.TextField(blank=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reservations', to='api.client')),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reservations', to='api.salle')),
            ],
            options={'ordering': ['date_reservation', 'heure_reservation']},
        ),
        migrations.CreateModel(
            name='Detail_Reservation_Table',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reservation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.reservation')),
                ('table', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.table')),
            ],
            options={'unique_together': {('reservation', 'table')}},
        ),
        # ─── Orders & billing ─────────────────────────────────────────────────
        migrations.CreateModel(
            name='Commande',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_commande', models.DateTimeField(auto_now_add=True)),
                ('statut_commande', models.CharField(choices=[('open', 'En cours'), ('paid', 'Payée'), ('cancelled', 'Annulée')], default='open', max_length=20)),
                ('total_commande', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('notes_commande', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='commandes', to='api.client')),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='commandes', to='api.salle')),
                ('table', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='commandes', to='api.table')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='commandes', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-date_commande']},
        ),
        migrations.CreateModel(
            name='Ligne_Commande',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantite', models.PositiveIntegerField(default=1)),
                ('prix_unitaire', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_ligne', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('notes_ligne', models.TextField(blank=True)),
                ('type_element', models.CharField(choices=[('plat', 'Plat'), ('produit', 'Produit'), ('formule', 'Formule')], max_length=20)),
                ('commande', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lignes', to='api.commande')),
                ('formule', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lignes_commande', to='api.formule')),
                ('plat', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lignes_commande', to='api.plat')),
                ('produit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lignes_commande', to='api.produit')),
            ],
            options={'ordering': ['id']},
        ),
        migrations.CreateModel(
            name='Facture',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_facture', models.DateField(auto_now_add=True)),
                ('montant_total', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('statut_facture', models.CharField(choices=[('paid', 'Payée'), ('unpaid', 'Impayée'), ('overdue', 'En retard')], default='unpaid', max_length=20)),
                ('tva', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('remise', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('notes_facture', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='factures', to='api.client')),
                ('commande', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='facture', to='api.commande')),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='factures', to='api.salle')),
            ],
            options={'ordering': ['-date_facture']},
        ),
        migrations.CreateModel(
            name='Paiement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('montant_paiement', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date_paiement', models.DateTimeField(auto_now_add=True)),
                ('mode_paiement', models.CharField(choices=[('cash', 'Espèces'), ('card', 'Carte'), ('online', 'En ligne'), ('other', 'Autre')], max_length=20)),
                ('reference_paiement', models.CharField(blank=True, max_length=200)),
                ('statut_paiement', models.CharField(choices=[('completed', 'Terminé'), ('failed', 'Échoué'), ('pending', 'En attente')], default='completed', max_length=20)),
                ('facture', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='paiements', to='api.facture')),
            ],
            options={'ordering': ['-date_paiement']},
        ),
        # ─── Apport ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Type_Apport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_type_apport', models.CharField(max_length=200)),
                ('description_type_apport', models.TextField(blank=True)),
            ],
            options={'ordering': ['nom_type_apport']},
        ),
        migrations.CreateModel(
            name='Apport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('valeur_apport', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date_apport', models.DateField()),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='apports', to='api.salle')),
                ('type_apport', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='apports', to='api.type_apport')),
            ],
            options={'ordering': ['-date_apport']},
        ),
        # ─── Notifications & logs ─────────────────────────────────────────────
        migrations.CreateModel(
            name='Type_Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_type_notification', models.CharField(max_length=200)),
                ('description_type_notification', models.TextField(blank=True)),
            ],
            options={'ordering': ['nom_type_notification']},
        ),
        migrations.CreateModel(
            name='Type_Log_Activite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_type_log_activite', models.CharField(max_length=200)),
                ('description_type_log_activite', models.TextField(blank=True)),
            ],
            options={'ordering': ['nom_type_log_activite']},
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_notification', models.TextField()),
                ('date_notification', models.DateTimeField(auto_now_add=True)),
                ('lue', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='api.salle')),
                ('type_notification', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='api.type_notification')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-date_notification']},
        ),
        migrations.CreateModel(
            name='Log_Activite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_log', models.TextField()),
                ('date_log', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.CharField(blank=True, max_length=500)),
                ('salle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs_activite', to='api.salle')),
                ('type_log', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs', to='api.type_log_activite')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logs_activite', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-date_log']},
        ),
        # RoomMap: add salle
        migrations.AddField(
            model_name='roommap',
            name='salle',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='room_maps', to='api.salle'),
        ),
    ]
