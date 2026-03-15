from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye

User = get_user_model()
from apps.restaurant.models import Restaurant
from apps.notes.models import Note

class NoteModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user_note = User.objects.create_user(username='notecreator', password='password123')
        cls.type_employe_note = TypeEmploye.objects.create(nom_type="General Staff")
        cls.employe_note = Employe.objects.create(
            user=cls.user_note,
            nom="Notetaker",
            prenom="Test",
            type_employe=cls.type_employe_note
        )
        cls.restaurant_note = Restaurant.objects.create(
            nom_restaurant="Restaurant des Notes",
            adresse_restaurant="1 Rue des Notes",
            code_postal="75005",
            ville="Paris",
            numero_telephone="0123450987",
            numero_siret="12312312312312"
        )
        # Important: Lier l'employé au restaurant pour que la note soit valide
        # si une logique de validation (non présente dans le modèle Note actuel mais bonne pratique)
        # vérifiait que created_by est un employé du restaurant de la note.
        RestaurantEmploye.objects.create(restaurant=cls.restaurant_note, employe=cls.employe_note)


    def test_creer_note(self):
        note = Note.objects.create(
            created_by=self.employe_note,
            restaurant=self.restaurant_note,
            message="Ceci est un message de test pour une note."
        )
        self.assertIsNotNone(note.id)
        self.assertEqual(note.created_by, self.employe_note)
        self.assertEqual(note.restaurant, self.restaurant_note)
        self.assertEqual(note.message, "Ceci est un message de test pour une note.")
        self.assertTrue(note.created_at <= timezone.now()) # auto_now_add
        
        expected_str = f"Note par {self.employe_note} pour {self.restaurant_note.nom_restaurant} : {note.message}"
        self.assertEqual(str(note), expected_str)

        note_dict = note.to_dict()
        self.assertEqual(note_dict['id'], note.id)
        self.assertEqual(note_dict['message'], note.message)
        self.assertEqual(note_dict['restaurant']['id'], self.restaurant_note.id_restaurant)
        self.assertEqual(note_dict['created_by']['id'], self.employe_note.id)


    def test_note_message_non_vide_par_defaut(self):
        # Teste le default="Vide" pour le message si non fourni (bien que blank=False le rendrait obligatoire à la création)
        # En l'état actuel, blank=False et default="Vide" est un peu contradictoire.
        # Si blank=False, le champ est requis. Si default est là, il est utilisé si le champ N'EST PAS fourni.
        # Django admin ou ModelForm forcera la saisie si blank=False.
        # Si on crée directement avec .objects.create() sans le champ, le default s'applique.
        note_default_msg = Note.objects.create(
            created_by=self.employe_note,
            restaurant=self.restaurant_note
            # message non fourni, on attend le default="Vide"
        )
        self.assertEqual(note_default_msg.message, "Vide") 