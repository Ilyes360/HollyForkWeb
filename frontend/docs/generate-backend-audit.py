#!/usr/bin/env python3
"""Generate the backend audit PDF."""
from fpdf import FPDF

class AuditPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(80, 80, 80)
        self.cell(0, 8, "Holy Fork - Audit Backend", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(230, 120, 30)
        self.set_line_width(0.6)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, num, title, severity, severity_color):
        self.ln(4)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 30, 30)
        self.cell(0, 8, f"Bug #{num} - {title}", new_x="LMARGIN", new_y="NEXT")
        # Severity badge
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*severity_color)
        self.set_text_color(255, 255, 255)
        w = self.get_string_width(severity) + 8
        self.cell(w, 5.5, severity, fill=True, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(30, 30, 30)
        self.ln(3)

    def field(self, label, value):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(100, 100, 100)
        self.cell(22, 5, label, new_x="END")
        self.set_font("Courier", "", 9)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, value, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def code_block(self, code):
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(245, 245, 245)
        self.set_text_color(40, 40, 40)
        x = self.get_x()
        self.set_x(x + 4)
        self.multi_cell(180, 4.5, code, fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def separator(self):
        self.ln(2)
        self.set_draw_color(220, 220, 220)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(2)


pdf = AuditPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Title
pdf.set_font("Helvetica", "B", 22)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 12, "Audit Backend", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(120, 120, 120)
pdf.cell(0, 7, "Bugs non corrigeables depuis le frontend - 14 juillet 2026", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)

pdf.body_text(
    "Ce document liste les bugs identifis dans le backend Django qui provoquent "
    "des erreurs 500 ou des comportements inattendus. Ces bugs ne peuvent pas "
    "etre corriges cote frontend - ils necessitent une modification du code Python."
)

pdf.separator()

# -- Bug 1 --
pdf.section_title(1, "Race condition sur l'occupation des tables", "MOYEN", (230, 140, 20))
pdf.field("Fichier", "apps/commandes/models.py")
pdf.field("Lignes", "248 et 275 (methode save() de Commande)")

pdf.body_text(
    "Le save() de Commande lit l'ancien etat avec Commande.objects.get(pk=self.pk) "
    "sans verrou. Si deux requetes arrivent en meme temps sur la meme commande "
    "(ex: deux serveurs changent la table), l'etat is_occupied peut devenir "
    "incoherent : une table reste marquee 'occupee' alors qu'elle est libre, "
    "ou inversement."
)

pdf.set_font("Helvetica", "B", 9)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 5, "Correction :", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
pdf.code_block(
    "# Ligne 248 et 275 - remplacer :\n"
    "old_instance = Commande.objects.get(pk=self.pk)\n\n"
    "# par :\n"
    "old_instance = Commande.objects.select_for_update().get(pk=self.pk)\n\n"
    "# Et envelopper le save() dans une transaction :\n"
    "from django.db import transaction\n"
    "with transaction.atomic():\n"
    "    super().save(*args, **kwargs)"
)

pdf.separator()

# -- Bug 2 --
pdf.section_title(2, "Double archivage = crash DoesNotExist", "MOYEN", (230, 140, 20))
pdf.field("Fichier", "apps/commandes/models.py")
pdf.field("Lignes", "273-304 (methode save() de Commande)")

pdf.body_text(
    "Quand une commande passe en VALIDEE ou ANNULEE, le save() cree une copie "
    "dans CommandeHistoric puis appelle super().delete() pour supprimer l'original. "
    "Si save() est appele une deuxieme fois (signal, middleware, double-click), "
    "le second appel fait Commande.objects.get(pk=self.pk) sur un objet supprime "
    "-> crash DoesNotExist."
)

pdf.set_font("Helvetica", "B", 9)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 5, "Correction :", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
pdf.code_block(
    "# Ligne 274 - remplacer :\n"
    "if self.pk:\n"
    "    old_instance = Commande.objects.get(pk=self.pk)\n\n"
    "# par :\n"
    "if self.pk and Commande.objects.filter(pk=self.pk).exists():\n"
    "    old_instance = Commande.objects.select_for_update().get(pk=self.pk)"
)

pdf.separator()

# -- Bug 3 --
pdf.section_title(3, "Quantite ligne commande = 1 par defaut (silencieux)", "MINEUR", (180, 180, 180))
pdf.field("Fichier", "apps/commandes/serializers.py")
pdf.field("Ligne", "44")

pdf.body_text(
    "Dans LigneCommandeSerializer.create(), si le champ quantity n'est pas "
    "envoye par le client, la ligne est creee avec quantite=1 sans erreur. "
    "Le frontend envoie toujours la quantite, donc pas de crash, mais un "
    "autre client API pourrait creer des lignes avec une quantite inattendue."
)

pdf.set_font("Helvetica", "B", 9)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 5, "Correction :", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
pdf.code_block(
    "# Soit ajouter required=True sur le champ serializer :\n"
    "quantity = serializers.IntegerField(source='quantite', required=True)\n\n"
    "# Soit documenter le default=1 comme comportement voulu."
)

pdf.separator()

# -- Recap --
pdf.ln(4)
pdf.set_font("Helvetica", "B", 14)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 8, "Resume", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)

# Table header
pdf.set_font("Helvetica", "B", 9)
pdf.set_fill_color(245, 245, 245)
pdf.set_text_color(80, 80, 80)
pdf.cell(10, 7, "#", border=1, fill=True, align="C")
pdf.cell(80, 7, "Probleme", border=1, fill=True)
pdf.cell(50, 7, "Fichier", border=1, fill=True)
pdf.cell(22, 7, "Severite", border=1, fill=True, align="C")
pdf.cell(28, 7, "Status", border=1, fill=True, align="C")
pdf.ln()

# Table rows
rows = [
    ("1", "Race condition tables", "models.py:248,275", "Moyen", "A faire"),
    ("2", "Double archivage crash", "models.py:273-304", "Moyen", "A faire"),
    ("3", "Quantite default 1", "serializers.py:44", "Mineur", "A faire"),
]
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(50, 50, 50)
for row in rows:
    pdf.cell(10, 6, row[0], border=1, align="C")
    pdf.cell(80, 6, row[1], border=1)
    pdf.cell(50, 6, row[2], border=1)
    pdf.cell(22, 6, row[3], border=1, align="C")
    pdf.cell(28, 6, row[4], border=1, align="C")
    pdf.ln()

out = "/Users/antoinemoulin/Documents/Side projects/Holly_Fork-dahsboard/HollyForkWeb/frontend/docs/audit-backend-bugs.pdf"
pdf.output(out)
print(f"PDF generated: {out}")
