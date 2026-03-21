import { describe, it, expect } from "vitest"
import { TOAST } from "@/lib/copy/toasts"

describe("TOAST", () => {
  it("generates product added message", () => {
    expect(TOAST.productAdded("Saumon")).toBe("Saumon ajoute a ton stock.")
  })

  it("generates product deleted message", () => {
    expect(TOAST.productDeleted("Saumon")).toBe("Saumon retire du stock.")
  })

  it("generates order placed message", () => {
    expect(TOAST.orderPlaced("Metro")).toBe("Commande passee chez Metro.")
  })

  it("generates order delivered message", () => {
    expect(TOAST.orderDelivered("Metro")).toBe("Livraison de Metro receptionnee.")
  })

  it("generates order started message", () => {
    expect(TOAST.orderStarted("Saumon")).toBe("Commande lancee pour Saumon.")
  })

  it("generates recipe created message", () => {
    expect(TOAST.recipeCreated("Tiramisu")).toBe("Tiramisu ajoutee a ta carte.")
  })

  it("generates recipe deleted message", () => {
    expect(TOAST.recipeDeleted("Tiramisu")).toBe("Tiramisu retiree de la carte.")
  })

  it("generates reservation confirmed message", () => {
    expect(TOAST.reservationConfirmed("Dupont")).toBe("Reservation de Dupont confirmee.")
  })

  it("generates reservation refused message", () => {
    expect(TOAST.reservationRefused("Dupont")).toBe("Reservation de Dupont refusee.")
  })

  it("generates reservation cancelled message", () => {
    expect(TOAST.reservationCancelled("Dupont")).toBe("Reservation de Dupont annulee.")
  })

  it("has static leave approved message", () => {
    expect(TOAST.leaveApproved).toBe("Demande de conge approuvee.")
  })

  it("has static all notifications read message", () => {
    expect(TOAST.allNotificationsRead).toContain("marquees comme lues")
  })

  it("has static onboarding complete message", () => {
    expect(TOAST.onboardingComplete).toContain("Bienvenue")
  })

  it("has static action in development message", () => {
    expect(TOAST.actionInDevelopment).toContain("developpement")
  })

  it("has static permission denied message", () => {
    expect(TOAST.permissionDenied).toContain("non autorisee")
  })

  it("has static server error message", () => {
    expect(TOAST.serverError).toContain("Erreur serveur")
  })

  it("has static network error message", () => {
    expect(TOAST.networkError).toContain("Connexion perdue")
  })
})
