"""
Shared abstract base models.

Every domain model in this project (Property, Tenant, Lease, Invoice, ...)
inherits from these so that:

1. Audit fields (who created/updated a record, and when) are never
   forgotten on a new table -- the spec calls for them on every entity.
2. Multi-tenant scoping (which Organization a row belongs to) is applied
   consistently, instead of being re-implemented per app and risking a
   forgotten filter that leaks one customer's data into another's view.

Design note: we use application-level scoping (an `organization`
foreign key + a manager that filters by it) rather than separate
databases/schemas per tenant. This is the right tradeoff for an MVP --
much cheaper to build and operate -- and can be revisited later if a
specific enterprise client requires physical data isolation.
"""

from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """
    Adds created/updated audit trail fields to any model that inherits it.

    `created_by` / `updated_by` are nullable because some records may be
    created by the system (e.g. an automated invoice run), not a human user.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="User who created this record. Null if created by the system.",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="User who last updated this record.",
    )

    class Meta:
        abstract = True


class OrgScopedManager(models.Manager):
    """
    Default manager for any model scoped to an Organization.

    Provides `.for_organization(org)` so views/services filter explicitly
    and consistently, rather than every app writing its own
    `.filter(organization=...)` and risking someone forgetting it on one
    endpoint.
    """

    def for_organization(self, organization):
        return self.get_queryset().filter(organization=organization)


class OrgScopedModel(TimeStampedModel):
    """
    Base class for every entity that belongs to a single Organization
    (i.e. almost everything in this system: Property, Tenant, Lease,
    Invoice...).

    Adding `organization` here -- rather than on each model individually --
    guarantees no domain table is accidentally left un-scoped as the
    project grows.
    """

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        help_text="The organization (property management company) that owns this record.",
    )

    objects = OrgScopedManager()

    class Meta:
        abstract = True
