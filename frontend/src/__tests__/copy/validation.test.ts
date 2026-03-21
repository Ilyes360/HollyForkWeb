import { describe, it, expect } from "vitest"
import { getValidationMessage } from "@/lib/copy/validation"

describe("getValidationMessage", () => {
  it("returns specific message for name required", () => {
    expect(getValidationMessage("name", "required")).toBe("Donne un nom a ton produit")
  })

  it("returns specific message for price minValue", () => {
    expect(getValidationMessage("price", "minValue")).toContain("superieur a 0")
  })

  it("returns specific message for date required", () => {
    expect(getValidationMessage("date", "required")).toBe("Choisis une date")
  })

  it("returns specific message for phone format", () => {
    expect(getValidationMessage("phone", "format")).toContain("06 12 34 56 78")
  })

  it("returns specific message for email format", () => {
    expect(getValidationMessage("email", "format")).toContain("Verifie")
  })

  it("returns specific message for covers minValue", () => {
    expect(getValidationMessage("covers", "minValue")).toBe("Au moins 1 couvert")
  })

  it("returns fallback for unknown field", () => {
    expect(getValidationMessage("unknown_field", "required")).toBe("Ce champ est requis")
  })

  it("returns fallback for unknown rule", () => {
    expect(getValidationMessage("name", "unknown_rule")).toBe("Ce champ est invalide")
  })

  it("returns category required message", () => {
    expect(getValidationMessage("category", "required")).toBe("Choisis une categorie")
  })

  it("returns supplier required message", () => {
    expect(getValidationMessage("supplier", "required")).toBe("Choisis un fournisseur")
  })
})
