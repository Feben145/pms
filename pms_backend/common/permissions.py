"""
Shared role-based permission checks, used by workflow actions (e.g.
"approve a lease", "approve a tenant") that must be restricted to
specific roles rather than any authenticated org member.
"""

from rest_framework.permissions import BasePermission

# Roles allowed to approve leases/tenants. Leasing Officer can create
# and submit records, but approval requires a level up -- this is the
# whole point of an approval workflow: the person who submits isn't
# the person who signs off.
APPROVAL_ROLES = {"owner", "property_manager"}


def user_has_approval_privilege(user, organization):
    from organizations.models import Membership
    return Membership.objects.filter(
        user=user, organization=organization, role__in=APPROVAL_ROLES
    ).exists()


class HasApprovalPrivilege(BasePermission):
    """
    Use on approval-style actions. Requires the view to expose
    `get_organization_for_permission_check(request)` or falls back to
    `common.mixins.get_active_organization`.
    """

    message = "Only an Owner or Property Manager can approve this record."

    def has_permission(self, request, view):
        from common.mixins import get_active_organization
        organization = get_active_organization(request.user)
        return user_has_approval_privilege(request.user, organization)