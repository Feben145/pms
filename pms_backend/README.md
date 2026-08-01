# Property Management System — Backend

Multi-tenant SaaS backend for the PMS, built with Django + Django REST
Framework. See `docs/ARCHITECTURE.md` for the reasoning behind the key
structural decisions — read that before making changes that cross app
boundaries or touch multi-tenant scoping.

## Stack

- **Backend:** Django 6 + Django REST Framework
- **Auth:** JWT (`djangorestframework-simplejwt`)
- **Database:** PostgreSQL 16
- **API docs:** auto-generated OpenAPI/Swagger via `drf-spectacular`
- **Containerized:** Docker + Docker Compose for local/staging/prod parity

## Project layout

```
config/          Django project settings, root urls
common/          Shared base models (audit fields, multi-tenant scoping) and mixins
organizations/   Organization (tenant) + Membership (user-role-org link)   — FR (multi-tenancy)
properties/      Property, Building, Floor, Unit                          — FR-001 to FR-004
tenants/         Tenant                                                   — FR-005
leases/          Lease                                                    — FR-006
rentals/         Invoice, Payment                                         — FR-007
docs/            Architecture decisions and rationale
```

Each app under `properties/`, `tenants/`, `leases/`, `rentals/` follows
the same internal shape: `models.py`, `serializers.py`, `views.py`,
`urls.py`, `admin.py`. Once you've read one app, you've read the
pattern for all of them — new modules (`maintenance`, `vendors`, ...)
will follow the same shape in Phase 2.

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

Then, in a second terminal:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

- API root: http://localhost:8000/api/v1/
- Interactive API docs: http://localhost:8000/api/docs/
- Django admin (usable as an internal back-office UI immediately): http://localhost:8000/admin/

## Running without Docker (quick scripting only)

Set `USE_SQLITE=True` as an environment variable to skip Postgres
entirely. This is meant for quickly poking at models in `manage.py
shell`, not for real development — Docker + Postgres is the standard
path so local matches staging/production.

```bash
pip install -r requirements.txt
USE_SQLITE=True python manage.py migrate
USE_SQLITE=True python manage.py runserver
```

## Multi-tenancy — read before adding a new model

Every domain model must inherit `common.models.OrgScopedModel`, and
every ViewSet must inherit `common.mixins.OrgScopedViewSetMixin`. This
is what guarantees Company A never sees Company B's data. See
`docs/ARCHITECTURE.md` section 1 for the full rationale.

## Adding a new module (e.g. Phase 2's `maintenance`)

1. `python manage.py startapp maintenance`
2. Add it to `INSTALLED_APPS` in `config/settings.py`
3. Models inherit `OrgScopedModel` (see `properties/models.py` for the pattern)
4. Serializers, views (inherit `OrgScopedViewSetMixin`), urls — copy the shape from `tenants/` (smallest example)
5. Register the app's urls in `config/urls.py`
6. `python manage.py makemigrations maintenance && python manage.py migrate`
7. Add a short entry to `docs/ARCHITECTURE.md` if the module introduces a new pattern
