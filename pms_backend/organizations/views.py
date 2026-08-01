from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from common.mixins import get_active_organization
from .models import Organization, Membership
from .serializers import OrganizationSerializer, MembershipSerializer


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only: organizations are provisioned by an internal onboarding
    process (or an admin), not created by end users through the API.
    """

    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user).distinct()


class MembershipViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Membership.objects.filter(user=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """
    Returns who's logged in and which organization they're acting as --
    the frontend uses this to replace any hardcoded org/user display
    with the real thing, instead of guessing from local state.
    """
    organization = get_active_organization(request.user)
    membership = Membership.objects.get(user=request.user, organization=organization)
    return Response(
        {
            "username": request.user.username,
            "full_name": request.user.get_full_name() or request.user.username,
            "organization": {"id": organization.id, "name": organization.name},
            "role": membership.role,
        }
    )
