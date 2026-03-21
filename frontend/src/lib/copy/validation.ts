type FieldKey =
  | "name"
  | "price"
  | "date"
  | "phone"
  | "email"
  | "covers"
  | "quantity"
  | "category"
  | "unit"
  | "supplier"

type RuleKey = "required" | "min" | "max" | "format" | "minValue"

const MESSAGES: Partial<Record<FieldKey, Partial<Record<RuleKey, string>>>> = {
  name: {
    required: "Donne un nom a ton produit",
  },
  price: {
    required: "Indique un prix",
    minValue: "Le prix doit etre superieur a 0 \u20ac",
  },
  date: {
    required: "Choisis une date",
    format: "Format de date invalide",
  },
  phone: {
    required: "Indique un numero de telephone",
    format: "Numero incomplet \u2014 format : 06 12 34 56 78",
  },
  email: {
    required: "Indique une adresse email",
    format: "Verifie l'adresse email",
  },
  covers: {
    required: "Indique le nombre de couverts",
    minValue: "Au moins 1 couvert",
  },
  quantity: {
    required: "Indique une quantite",
    minValue: "La quantite doit etre superieure a 0",
  },
  category: {
    required: "Choisis une categorie",
  },
  unit: {
    required: "Choisis une unite",
  },
  supplier: {
    required: "Choisis un fournisseur",
  },
}

const FALLBACKS: Record<RuleKey, string> = {
  required: "Ce champ est requis",
  min: "Valeur trop courte",
  max: "Valeur trop longue",
  format: "Format invalide",
  minValue: "Valeur trop faible",
}

export function getValidationMessage(
  field: string,
  rule: string,
): string {
  const fieldMessages = MESSAGES[field as FieldKey]
  if (fieldMessages) {
    const msg = fieldMessages[rule as RuleKey]
    if (msg) return msg
  }
  return FALLBACKS[rule as RuleKey] ?? "Ce champ est invalide"
}
