#!/usr/bin/env python3
"""Generate the changelog PDF for this session's modifications."""
from fpdf import FPDF


class ChangelogPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(80, 80, 80)
        self.cell(0, 8, "Holy Fork - Changelog session", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(230, 120, 30)
        self.set_line_width(0.6)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section(self, title, tag, tag_color):
        self.ln(3)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(30, 30, 30)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(*tag_color)
        self.set_text_color(255, 255, 255)
        w = self.get_string_width(tag) + 8
        self.cell(w, 5, tag, fill=True, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(30, 30, 30)
        self.ln(3)

    def item(self, label, detail):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(80, 80, 80)
        self.cell(4, 5, "", new_x="END")
        self.cell(0, 5, label, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(100, 100, 100)
        self.set_x(14)
        self.multi_cell(180, 4.5, detail, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def file_ref(self, path):
        self.set_font("Courier", "", 8)
        self.set_text_color(130, 130, 130)
        self.set_x(14)
        self.cell(0, 4, path, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def sep(self):
        self.ln(2)
        self.set_draw_color(220, 220, 220)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(2)


pdf = ChangelogPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Title
pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 14, "Modifications effectuees", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(120, 120, 120)
pdf.cell(0, 7, "Session du 14 juillet 2026", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)

pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(60, 60, 60)
pdf.multi_cell(0, 5.5,
    "Resume des modifications apportees au frontend et au backend "
    "durant cette session de travail.",
    new_x="LMARGIN", new_y="NEXT")

pdf.sep()

# ────────────────────────────────────────────────
# 1. PARAMETRES
# ────────────────────────────────────────────────
pdf.section("1. Pages Parametres", "UI / LAYOUT", (60, 130, 200))

pdf.item("Pleine largeur du contenu",
    "Suppression de la contrainte max-w-3xl mx-auto qui centrait le contenu "
    "dans une colonne etroite. Le formulaire occupe maintenant toute la largeur disponible.")
pdf.file_ref("src/pages/parametres/index.tsx")

pdf.item("Padding contenu augmente",
    "Le padding entre la sidebar et le contenu passe de 16px (spacing*4) a 32px (spacing*8) "
    "pour plus de respiration visuelle.")
pdf.file_ref("src/layouts/root-layout.tsx")

pdf.item("Onglet Notifications bloque",
    "Remplacement du formulaire notifications par un placeholder 'Bientot disponible'. "
    "Aucun appel API n'est effectue.")
pdf.file_ref("src/pages/parametres/notifications-form.tsx")

pdf.item("Onglet Facturation bloque",
    "Remplacement de la page facturation (billing settings, moyens de paiement, "
    "historique factures) par un placeholder 'Bientot disponible'.")
pdf.file_ref("src/pages/parametres/billing/page.tsx")

pdf.item("Page Pricing redirige",
    "La sous-route /settings/billing/pricing redirige vers /settings/billing "
    "puisque la facturation est bloquee.")
pdf.file_ref("src/pages/parametres/billing/pricing-table.tsx")

pdf.sep()

# ────────────────────────────────────────────────
# 2. HEADER
# ────────────────────────────────────────────────
pdf.section("2. Header", "UI", (60, 130, 200))

pdf.item("Bouton 'Premiers pas' retire",
    "L'icone GettingStartedButton (livre) a ete retiree du header car la feature "
    "n'est pas connectee a l'API. Peut etre reintegree plus tard.")
pdf.file_ref("src/components/layout/header/index.tsx")

pdf.sep()

# ────────────────────────────────────────────────
# 3. BUG FIXES
# ────────────────────────────────────────────────
pdf.section("3. Corrections de bugs", "BUGFIX", (220, 60, 60))

pdf.item("Endpoint methodes de paiement corrige (frontend)",
    "Le hook usePaymentMethods appelait 'billing/methodes-paiement/' mais le backend "
    "expose '/api/methodes-paiement/' (sans prefixe billing). Corrige : suppression "
    "du prefixe 'billing/'.")
pdf.file_ref("src/hooks/use-settings.ts  (ligne 237)")

pdf.item("Validation commande 500 corrigee (backend)",
    "Dans views.py, le code lisait validated_data.get('status') mais DRF utilise "
    "le nom du champ modele ('statut') dans validated_data, pas l'alias serializer. "
    "Resultat : le statut VALIDEE/ANNULEE n'etait jamais detecte, l'archivage se "
    "faisait quand meme dans le save() du modele, puis refresh_from_db() crashait "
    "sur un objet supprime. Corrige : get('statut').")
pdf.file_ref("apps/commandes/views.py  (ligne 237)")

pdf.item("Serializers manquants corriges (backend)",
    "CategorieIngredientSerializer et ZoneStockageSerializer etaient importes dans "
    "views.py mais supprimes de serializers.py. Le backend ne demarrait pas. "
    "Les deux serializers ont ete recrees.")
pdf.file_ref("apps/inventory/serializers.py")

pdf.sep()

# ────────────────────────────────────────────────
# 4. UX
# ────────────────────────────────────────────────
pdf.section("4. Ameliorations UX", "UX", (50, 170, 100))

pdf.item("Skeletons dashboard KPIs",
    "Ajout de 4 cartes skeleton animees pendant le chargement des KPIs du dashboard. "
    "Remplace l'affichage 'N/A' par des placeholders visuels.")
pdf.file_ref("src/pages/dashboard.tsx")

pdf.item("Etat erreur avec retry (dashboard)",
    "Nouveau composant ErrorState reutilisable (icone alerte, message, bouton 'Reessayer'). "
    "Utilise sur le dashboard quand les KPIs echouent. Le hook useDashboard expose "
    "maintenant isError et refetch.")
pdf.file_ref("src/components/shared/error-state.tsx")
pdf.file_ref("src/hooks/use-dashboard.ts")

pdf.item("Empty state Planning",
    "Quand aucun creneau n'est planifie, affiche un message 'Aucun creneau planifie' "
    "avec un bouton 'Modifier le planning' au lieu d'une grille vide.")
pdf.file_ref("src/pages/planning.tsx")

pdf.item("Empty state Reservations ameliore",
    "Le message vide dans le tableau des reservations affiche maintenant "
    "'Aucune reservation pour ce service. Appuyez sur N pour en creer une.' "
    "au lieu d'un simple 'Aucune reservation trouvee'.")
pdf.file_ref("src/components/reservations/reservations-table.tsx")

pdf.item("Support prefers-reduced-motion",
    "Ajout d'une media query globale qui desactive toutes les animations CSS "
    "(marker-enter, gantt-noshow-pulse) et reduit les durees de transition "
    "a quasi-zero quand l'utilisateur a active 'reduire les animations' dans son OS.")
pdf.file_ref("src/index.css")

pdf.sep()

# ────────────────────────────────────────────────
# RECAP TABLE
# ────────────────────────────────────────────────
pdf.ln(2)
pdf.set_font("Helvetica", "B", 14)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 8, "Fichiers modifies", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)

pdf.set_font("Helvetica", "B", 8)
pdf.set_fill_color(245, 245, 245)
pdf.set_text_color(80, 80, 80)
pdf.cell(8, 6, "#", border=1, fill=True, align="C")
pdf.cell(110, 6, "Fichier", border=1, fill=True)
pdf.cell(22, 6, "Type", border=1, fill=True, align="C")
pdf.cell(50, 6, "Changement", border=1, fill=True)
pdf.ln()

rows = [
    ("1",  "parametres/index.tsx",               "UI",     "Pleine largeur"),
    ("2",  "root-layout.tsx",                     "UI",     "Padding augmente"),
    ("3",  "parametres/notifications-form.tsx",   "UI",     "Bloque (placeholder)"),
    ("4",  "parametres/billing/page.tsx",         "UI",     "Bloque (placeholder)"),
    ("5",  "parametres/billing/pricing-table.tsx", "UI",    "Redirect"),
    ("6",  "layout/header/index.tsx",             "UI",     "Premiers pas retire"),
    ("7",  "use-settings.ts",                     "Bugfix", "Endpoint corrige"),
    ("8",  "use-dashboard.ts",                    "UX",     "isError + refetch"),
    ("9",  "dashboard.tsx",                       "UX",     "Skeletons + erreur"),
    ("10", "planning.tsx",                        "UX",     "Empty state"),
    ("11", "reservations-table.tsx",              "UX",     "Empty state ameliore"),
    ("12", "error-state.tsx",                     "UX",     "Nouveau composant"),
    ("13", "index.css",                           "A11y",   "reduced-motion"),
    ("14", "commandes/views.py (backend)",        "Bugfix", "Cle validated_data"),
    ("15", "inventory/serializers.py (backend)",  "Bugfix", "Serializers recrees"),
]

pdf.set_font("Helvetica", "", 8)
pdf.set_text_color(50, 50, 50)
for r in rows:
    pdf.cell(8, 5.5, r[0], border=1, align="C")
    pdf.cell(110, 5.5, r[1], border=1)
    pdf.cell(22, 5.5, r[2], border=1, align="C")
    pdf.cell(50, 5.5, r[3], border=1)
    pdf.ln()

out = "/Users/antoinemoulin/Documents/Side projects/Holly_Fork-dahsboard/HollyForkWeb/frontend/docs/changelog-session-2026-07-14.pdf"
pdf.output(out)
print(f"PDF generated: {out}")
