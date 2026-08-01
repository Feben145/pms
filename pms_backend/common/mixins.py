"""
Shared DRF view mixin that enforces multi-tenant scoping automatically.

Every ViewSet for an OrgScopedModel should inherit `OrgScopedViewSetMixin`
instead of filtering by organization manually in `get_queryset()`. This
is the single place that decides "which organization is this request
acting as" -- if that logic ever needs to change (e.g. to support a
staff user switching between organizations), it changes here once,
not in every view across every app.

For the MVP we take the user's first Membership as their active
organization. A user who belongs to multiple organizations (e.g. a
contractor) will need an explicit "active org" selector later --
tracked as a follow-up, not solved here to avoid over-building before
it's a real use case.
"""

from rest_framework.exceptions import PermissionDenied


def get_active_organization(user):
    membership = user.memberships.select_related("organization").first()
    if membership is None:
        raise PermissionDenied("User is not a member of any organization.")
    return membership.organization


class OrgScopedViewSetMixin:
    """Restricts all queries and creates to the requesting user's organization."""

    def get_queryset(self):
        organization = get_active_organization(self.request.user)
        return self.queryset.model.objects.for_organization(organization)

    def perform_create(self, serializer):
        organization = get_active_organization(self.request.user)
        serializer.save(organization=organization, created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
