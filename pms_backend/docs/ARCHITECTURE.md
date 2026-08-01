# Architecture Decisions

This file is our running log of *why*, not just *what*. Add a new
section here whenever a decision would confuse someone joining later
if left unexplained. Keep entries short.

## 1. Multi-tenant, application-level scoping

The system is built as a SaaS platform from the start: multiple
property management companies (`Organization`) share the same
deployment, but each only ever sees its own data.

Isolation is enforced at the application layer: every domain table has
an `organization` foreign key (via `common.models.OrgScopedModel`), and
every API view filters through `common.mixins.OrgScopedViewSetMixin`
rather than each view writing its own filter. This is cheaper to build
and operate than physically separate databases per tenant, and is the
right tradeoff for an MVP. If a specific enterprise client later
requires physical data isolation (separate schema/database), that can
be layered in without changing the application code that already
assumes "current user's organization" — only the connection routing
changes.

**Consequence:** never write `Model.objects.all()` or `.filter(...)`
directly against an org-scoped model in a view. Always go through
`OrgScopedViewSetMixin` or `Model.objects.for_organization(org)`. A
missed filter is a data leak between customers, not just a bug.

## 2. One Django app per functional module

`organizations`, `properties`, `tenants`, `leases`, `rentals` (and
later `maintenance`, `vendors`, `facilities`) each map to one section
of the original requirements spec. Each app owns its own models,
serializers, views, urls, migrations, and tests.

This keeps module boundaries visible in the folder structure (not just
in a design doc), makes code review scoped and predictable, and means
a module can be split into its own service later without having to
first untangle it from the others — it was never tangled in the first
place.

## 3. Django + DRF over FastAPI for the MVP

The team's strongest stack is Python. Django was chosen over bare
FastAPI because the MVP needs auth, an admin UI, an ORM with
migrations, and permissions — Django ships all of this, letting
`django.contrib.admin` double as an internal back-office tool for
property managers on day one, in parallel with building the polished
React frontend. This directly serves the Phase 1 goal of a fast,
convincing client demo without sacrificing the data layer we'll still
need at scale.

## 4. Deferred decisions (intentional, not oversights)

These are real Phase 2/3 needs called out in the original spec, left
out of the Phase 1 schema on purpose, to avoid over-building before
the core lease/rent loop is validated with a real client:

- Tenant: emergency contacts, credit check, blacklist flag
- Property/Building/Unit: utility meter details, amenities, documents
- Lease: amendments, e-signature integration, escalation rules
- Rental: discounts/promotions, penalty/interest automation, GL posting

Each will get its own migration and, where it changes existing
behavior, its own ADR entry here.

## 5. Active organization resolution (current limitation)

`get_active_organization()` currently takes a user's *first*
`Membership` as their active organization. This is correct for the
common case (one user, one organization) but not yet for a user
belonging to multiple organizations (e.g. a contractor working across
two clients). Tracked as a follow-up: introduce an explicit "active
organization" selector (header or session value) before onboarding
any user who needs multi-org access.

## 6. The two "tenant" concepts

Two unrelated things briefly shared the word "tenant" and caused real
confusion:

- `tenants.Tenant` -- a **business record**: who is renting a unit
  (name, phone, KYC status). Managed by staff; doesn't require login.
- `organizations.Membership.Role` -- a **login/access role**: what a
  logged-in `User` is allowed to do in the system.

We removed the `TENANT` choice from `Membership.Role` because it was
unused (no tenant portal exists yet) and purely a source of confusion.
When a tenant self-service portal is actually built, add the role back
under an unambiguous name (e.g. `"tenant_portal"`) and link it to a
specific `tenants.Tenant` row via a `portal_user` field on `Tenant` --
don't reuse the bare word "tenant" for the role a second time.

## 7. Platform-owner cross-organization visibility

Django admin is intentionally **not** org-scoped -- it shows every
client's data, unfiltered, to whoever has `is_staff`/`is_superuser`.
This is by design: it's the platform owner's support/billing tool, not
a client-facing surface.

`organizations.OrganizationAdmin` gives a one-screen cross-org
overview (property/tenant/active-lease counts and outstanding balance
per organization) for exactly this purpose.

**This is a real access boundary, not just a UI convenience**: only
internal platform team members should ever get `is_staff`/
`is_superuser`. A client's own staff (Property Manager, Leasing
Officer, Finance) must only ever get a `Membership` and use the
frontend app, where `OrgScopedViewSetMixin` enforces the per-org
boundary. Never give a client's user Django admin access -- it would
let them see every other client's data too.

A dedicated "Platform Console" (suspend a client, view billing plan,
impersonate a client's session for support) is deliberately not built
yet -- worth building once there are enough real clients to know what
that tool actually needs to do, rather than guessing now.

