from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Génère des données factices pour l\'application Holly PI'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirme la suppression des données existantes',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'Cette commande va supprimer toutes les données existantes.\n'
                    'Utilisez --confirm pour confirmer cette action.'
                )
            )
            return

        # Importer et exécuter la fonction de génération
        try:
            from scripts.generate_fake_data import generate_fake_data
            
            self.stdout.write(
                self.style.SUCCESS('Début de la génération des données factices...')
            )
            
            success = generate_fake_data()
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS('Données factices générées avec succès!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('Erreur lors de la génération des données factices.')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de l\'import ou de l\'exécution: {e}')
            )
