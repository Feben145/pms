from datetime import date

from rest_framework import viewsets, permissions, parsers, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from common.mixins import OrgScopedViewSetMixin, get_active_organization
from common.permissions import user_has_approval_privilege
from .models import Lease, LeaseDocument
from .serializers import LeaseSerializer, LeaseDocumentSerializer


class LeaseViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "unit", "tenant"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Workflow action, not a form field: moves a draft/pending lease to
        Active. Restricted to Owner/Property Manager. approved_by and
        approval_date are stamped here, server-side -- never accepted
        from the request body, so they can't be backdated or forged.
        """
        lease = self.get_object()
        organization = get_active_organization(request.user)

        if not user_has_approval_privilege(request.user, organization):
            return Response(
                {"detail": "Only an Owner or Property Manager can approve a lease."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        if lease.status not in [Lease.Status.DRAFT, Lease.Status.PENDING_APPROVAL]:
            return Response(
                {"detail": f"Cannot approve a lease with status '{lease.status}'."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        lease.status = Lease.Status.ACTIVE
        lease.approval_status = Lease.ApprovalStatus.APPROVED
        lease.approved_by = request.user
        lease.approval_date = date.today()
        lease.updated_by = request.user
        lease.save()

        serializer = self.get_serializer(lease)
        return Response(serializer.data)


class LeaseDocumentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = LeaseDocument.objects.all()
    serializer_class = LeaseDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["lease"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    