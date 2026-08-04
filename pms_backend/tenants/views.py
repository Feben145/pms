from datetime import date

from rest_framework import viewsets, permissions, parsers, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from common.mixins import OrgScopedViewSetMixin, get_active_organization
from common.permissions import user_has_approval_privilege
from .models import Tenant, TenantDocument
from .serializers import TenantSerializer, TenantDocumentSerializer


class TenantViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "tenant_type", "kyc_verified"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Workflow action, not a form field: moves a tenant awaiting review
        to Approved. Restricted to Owner/Property Manager. approved_by
        and approval_date are stamped here, server-side.
        """
        tenant = self.get_object()
        organization = get_active_organization(request.user)

        if not user_has_approval_privilege(request.user, organization):
            return Response(
                {"detail": "Only an Owner or Property Manager can approve a tenant."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        if tenant.status == Tenant.Status.APPROVED:
            return Response({"detail": "Tenant is already approved."}, status=http_status.HTTP_400_BAD_REQUEST)

        tenant.status = Tenant.Status.APPROVED
        tenant.approved_by = request.user
        tenant.approval_date = date.today()
        tenant.updated_by = request.user
        tenant.save()

        serializer = self.get_serializer(tenant)
        return Response(serializer.data)


class TenantDocumentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = TenantDocument.objects.all()
    serializer_class = TenantDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tenant"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    