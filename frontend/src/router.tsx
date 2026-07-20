import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router"

import AuthGuard from "@/guards/auth-guard"
import GuestGuard from "@/guards/guest-guard"
import RootLayout from "@/layouts/root-layout"
import PublicLayout from "@/layouts/public-layout"
import { PageSkeleton } from "@/components/shared/page-skeleton"
import { RouteErrorBoundary } from "@/components/shared/route-error-boundary"

// Lazy-loaded routes (heavy dependencies: Konva, Recharts, Mapbox GL)
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const ReservationsPage = lazy(() => import("@/pages/reservations"))
const SallePage = lazy(() => import("@/pages/salle"))
const PlanningPage = lazy(() => import("@/pages/planning"))
import CartePage from "@/pages/carte"
import CuisineRecipePage from "@/pages/cuisine-recipe"
import StocksPage from "@/pages/stocks"
import StocksProductPage from "@/pages/stocks-product"
import FournisseursPage from "@/pages/commandes"
import CommandesClientsPage from "@/pages/commandes-clients"
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
// Configuration page removed — zones managed inline via side panel

import { Navigate } from "react-router"

import LoginPage from "@/pages/public/login"
import RegisterPage from "@/pages/public/register"
import DeviceLoginPage from "@/pages/public/device-login"
import OnboardingPage from "@/pages/public/onboarding-flow/page"

export const router = createBrowserRouter([
  // Protected routes (require authentication)
  {
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <DashboardPage />
              </Suspense>
            ),
            errorElement: <RouteErrorBoundary />,
          },
          {
            path: "reservations",
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <ReservationsPage />
              </Suspense>
            ),
            errorElement: <RouteErrorBoundary />,
          },
          {
            path: "salle",
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <SallePage />
              </Suspense>
            ),
            errorElement: <RouteErrorBoundary />,
          },
          {
            path: "planning",
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <PlanningPage />
              </Suspense>
            ),
            errorElement: <RouteErrorBoundary />,
          },
          { path: "cuisine", element: <CartePage /> },
          { path: "cuisine/nouvelle", element: <CuisineRecipePage /> },
          { path: "cuisine/:id/modifier", element: <CuisineRecipePage /> },
          { path: "stocks", element: <StocksPage /> },
          {
            path: "stocks/configuration",
            element: <Navigate to="/stocks" replace />,
          },
          { path: "stocks/nouveau", element: <StocksProductPage /> },
          { path: "stocks/:id/modifier", element: <StocksProductPage /> },
          { path: "fournisseurs", element: <FournisseursPage /> },
          { path: "commandes-clients", element: <CommandesClientsPage /> },
          {
            path: "commandes",
            element: <Navigate to="/fournisseurs" replace />,
          },
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <EtablissementsPage /> },
              { path: "employes", element: <EmployesPage /> },
              { path: "roles", element: <RolesPage /> },
              {
                path: "etablissements/:id",
                element: <EtablissementDetailPage />,
              },
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
      // Onboarding is auth-protected (needs POST to API)
      {
        element: <PublicLayout />,
        children: [{ path: "onboarding", element: <OnboardingPage /> }],
      },
    ],
  },

  // Guest-only routes (redirect to / if already logged in)
  {
    element: <GuestGuard />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  // Device login accessible whether logged in or not
  { path: "device", element: <DeviceLoginPage /> },
  { path: "forgot-password", element: <Navigate to="/login" replace /> },
])
