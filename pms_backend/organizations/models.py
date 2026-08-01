"""
Organization is the top of the multi-tenant hierarchy.

Every property management company that signs up (or, for now, our single
demo client) is one Organization. Every other model in the system --
Property, Tenant, Lease, Invoice -- points back to an Organization,
directly or via the property hierarchy, so that one customer's data is
never visible to another.

A User does not belong to an Organization directly; instead a
Membership row links User <-> Organization <-> Role. This supports a
person who works across two client organizations (e.g. a contractor)
without duplicating their user account, and keeps "which org am I
acting as" explicit rather than implicit.
"""

from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Organization(TimeStampedModel):
    """A property management company using the platform (a SaaS tenant)."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, help_text="URL-safe identifier, e.g. for subdomains.")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Membership(TimeStampedModel):
    """
    Links a User to an Organization with a specific role.

    Role choices map to the personas in the functional spec (Property
    Manager, Leasing Officer, Finance, Tenant, ...). Kept as a simple
    choices field for the MVP; can move to a dedicated Role model with
    granular permissions later without changing callers, since access
    checks should go through a permission helper rather than raw string
    comparisons scattered across views.
    """

    class Role(models.TextChoices):
        OWNER = "owner", "Owner / Admin"
        PROPERTY_MANAGER = "property_manager", "Property Manager"
        LEASING_OFFICER = "leasing_officer", "Leasing Officer"
        FINANCE = "finance", "Finance"
        MAINTENANCE = "maintenance", "Maintenance Staff"
        # Intentionally no portal-login role for renters yet -- that's a
        # Phase 2+ feature (tenant self-service portal) and needs its own
        # link to a specific tenants.Tenant record when it's built. Adding
        # it here now, unused, is exactly what caused the "tenant" naming
        # collision -- see docs/ARCHITECTURE.md.

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=32, choices=Role.choices)

    class Meta:
        unique_together = ("user", "organization")

    def __str__(self):
        return f"{self.user} @ {self.organization} ({self.role})"
