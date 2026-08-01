# Property Management System — Frontend

React + TypeScript + Tailwind frontend for the PMS, covering Phase 1:
Dashboard, Properties (with Building/Floor/Unit drill-down), Tenants,
Leases, and Invoices/Payments. Talks to the Django backend via JWT.

## Stack

- **React 19 + TypeScript**, built with Vite
- **Tailwind CSS v4** for styling (utility classes, no component library)
- **React Router** for client-side routing and the auth guard
- **Axios** for API calls, with automatic JWT refresh on 401s

## Project layout

```
src/
  api/client.ts        Central Axios instance — auth headers + token refresh live here only
  auth/                 AuthContext (login state) + RequireAuth (route guard)
  hooks/useCollection.ts  Generic list/create/update hook used by every module page
  types/models.ts       TypeScript types mirroring the Django serializers
  layout/AppLayout.tsx  Sidebar + page shell
  components/           Shared UI: DataTable, StatusBadge, Modal, PageHeader
  pages/
    LoginPage.tsx
    dashboard/          Occupancy, revenue, and outstanding-balance stats
    properties/         Properties list + detail (Buildings → Floors → Units)
    tenants/
    leases/
    rentals/            Invoices + record-payment flow
```

Every module's list page follows the same shape: `useCollection(endpoint)`
for data, a `DataTable` for the list, and a `Modal` + form for creating
a new record. Read `pages/tenants/TenantsListPage.tsx` first — it's the
smallest complete example of the pattern.

## Running locally

```bash
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm install
npm run dev
```

Requires the backend running (see the backend repo's README) — this
app has no data of its own, it's a pure client for that API.

## Adding a new module (e.g. Phase 2's Maintenance)

1. Add the type to `src/types/models.ts`
2. Create `src/pages/maintenance/MaintenanceListPage.tsx`, copying the
   shape of `TenantsListPage.tsx` (simplest existing example)
3. Add the route in `src/App.tsx` and a nav entry in `src/layout/AppLayout.tsx`
