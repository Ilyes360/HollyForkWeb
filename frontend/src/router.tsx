import { createBrowserRouter } from "react-router"

// import AuthGuard from "@/guards/auth-guard"
// import GuestGuard from "@/guards/guest-guard"
import RootLayout from "@/layouts/root-layout"
import PublicLayout from "@/layouts/public-layout"

import DashboardPage from "@/pages/dashboard"
import ReservationsPage from "@/pages/reservations"
import SallePage from "@/pages/salle"
import PlanningPage from "@/pages/planning"
import CuisinePage from "@/pages/cuisine"
import CuisineRecipePage from "@/pages/cuisine-recipe"
import StocksPage from "@/pages/stocks"
import StocksProductPage from "@/pages/stocks-product"
import FournisseursPage from "@/pages/fournisseurs"
import FournisseurDetailPage from "@/pages/fournisseur-detail"
import AdminLayout from "@/pages/admin"
import EtablissementsPage from "@/pages/admin/etablissements"
import EtablissementDetailPage from "@/pages/admin/etablissement-detail"
import EmployesPage from "@/pages/admin/employes"
import EmployeDetailPage from "@/pages/admin/employe-detail"
import RolesPage from "@/pages/admin/roles"
import SettingsLayout from "@/pages/parametres"
import { GeneralForm } from "@/pages/parametres/general-form"
import { NotificationsForm } from "@/pages/parametres/notifications-form"
import { BillingPage } from "@/pages/parametres/billing/page"
import PricingTable from "@/pages/parametres/billing/pricing-table"
import StocksConfigurationPage from "@/pages/stocks/configuration"

import LoginPage from "@/pages/public/login"
import RegisterPage from "@/pages/public/register"
import ForgotPasswordPage from "@/pages/public/forgot-password"
import OnboardingPage from "@/pages/public/onboarding-flow/page"

export const router = createBrowserRouter([
  // Routes auth (guards désactivés pour le dev)
  {
    // TODO: réactiver <AuthGuard /> quand l'auth sera branchée
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "reservations", element: <ReservationsPage /> },
      { path: "salle", element: <SallePage /> },
      { path: "planning", element: <PlanningPage /> },
      { path: "cuisine", element: <CuisinePage /> },
      { path: "cuisine/nouvelle", element: <CuisineRecipePage /> },
      { path: "cuisine/:id/modifier", element: <CuisineRecipePage /> },
      { path: "stocks", element: <StocksPage /> },
      { path: "stocks/configuration", element: <StocksConfigurationPage /> },
      { path: "stocks/nouveau", element: <StocksProductPage /> },
      { path: "stocks/:id/modifier", element: <StocksProductPage /> },
      { path: "fournisseurs", element: <FournisseursPage /> },
      { path: "fournisseurs/:id", element: <FournisseurDetailPage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <EtablissementsPage /> },
          { path: "employes", element: <EmployesPage /> },
          { path: "roles", element: <RolesPage /> },
          { path: "etablissements/:id", element: <EtablissementDetailPage /> },
          { path: "employes/nouveau", element: <EmployeDetailPage /> },
          { path: "employes/:id", element: <EmployeDetailPage /> },
        ],
      },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <GeneralForm /> },
          { path: "notifications", element: <NotificationsForm /> },
          { path: "billing", element: <BillingPage /> },
          { path: "billing/pricing", element: <PricingTable /> },
        ],
      },
    ],
  },

  // Routes auth plein écran (split-screen layout intégré dans la page)
  {
    // TODO: réactiver <GuestGuard /> quand l'auth sera branchée
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },

  // Routes publiques centrées
  {
    element: <PublicLayout />,
    children: [
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
    ],
  },
])
