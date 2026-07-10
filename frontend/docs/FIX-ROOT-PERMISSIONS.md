# Fix permissions root

Le compte `root` (System Admin) a le rôle **Serveur** au lieu de **Gérant** en base.

Du coup il n'a pas `manage_staff` → le menu **Administration** est masqué côté frontend.

**A faire :** passer le type employé du compte root (employe id=1) de "Serveur" à "Gérant".
