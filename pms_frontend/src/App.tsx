import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PropertiesListPage from "./pages/properties/PropertiesListPage";
import PropertyDetailPage from "./pages/properties/PropertyDetailPage";
import PropertyRegistrationPage from "./pages/properties/PropertyRegistrationPage";
import BuildingsListPage from "./pages/buildings/BuildingsListPage";
import BuildingRegistrationPage from "./pages/buildings/BuildingRegistrationPage";
import BuildingDetailPage from "./pages/buildings/BuildingDetailPage";
import FloorsListPage from "./pages/floors/FloorsListPage";
import FloorRegistrationPage from "./pages/floors/FloorRegistrationPage";
import FloorDetailPage from "./pages/floors/FloorDetailPage";
import UnitsListPage from "./pages/units/UnitsListPage";
import UnitRegistrationPage from "./pages/units/UnitRegistrationPage";
import UnitDetailPage from "./pages/units/UnitDetailPage";
import TenantsListPage from "./pages/tenants/TenantsListPage";
import TenantRegistrationPage from "./pages/tenants/TenantRegistrationPage";
import TenantDetailPage from "./pages/tenants/TenantDetailPage";
import LeasesListPage from "./pages/leases/LeasesListPage";
import LeaseRegistrationPage from "./pages/leases/LeaseRegistrationPage";
import LeaseDetailPage from "./pages/leases/LeaseDetailPage";
import InvoicesListPage from "./pages/rentals/InvoicesListPage";
import ComingSoonPage from "./pages/misc/ComingSoonPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="properties" element={<PropertiesListPage />} />
            <Route path="properties/new" element={<PropertyRegistrationPage />} />
            <Route path="properties/:propertyId/edit" element={<PropertyRegistrationPage />} />
            <Route path="properties/:propertyId" element={<PropertyDetailPage />} />
            <Route path="buildings" element={<BuildingsListPage />} />
            <Route path="buildings/new" element={<BuildingRegistrationPage />} />
            <Route path="buildings/:buildingId/edit" element={<BuildingRegistrationPage />} />
            <Route path="buildings/:buildingId" element={<BuildingDetailPage />} />
            <Route path="floors" element={<FloorsListPage />} />
            <Route path="floors/new" element={<FloorRegistrationPage />} />
            <Route path="floors/:floorId/edit" element={<FloorRegistrationPage />} />
            <Route path="floors/:floorId" element={<FloorDetailPage />} />
            <Route path="units" element={<UnitsListPage />} />
            <Route path="units/new" element={<UnitRegistrationPage />} />
            <Route path="units/:unitId/edit" element={<UnitRegistrationPage />} />
            <Route path="units/:unitId" element={<UnitDetailPage />} />
            <Route path="tenants" element={<TenantsListPage />} />
            <Route path="tenants/new" element={<TenantRegistrationPage />} />
            <Route path="tenants/:tenantId/edit" element={<TenantRegistrationPage />} />
            <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
            <Route path="leases" element={<LeasesListPage />} />
            <Route path="leases/new" element={<LeaseRegistrationPage />} />
            <Route path="leases/:leaseId/edit" element={<LeaseRegistrationPage />} />
            <Route path="leases/:leaseId" element={<LeaseDetailPage />} />
            <Route path="invoices" element={<InvoicesListPage />} />
            <Route path="coming-soon/:slug" element={<ComingSoonPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}