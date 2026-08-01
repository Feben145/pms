from rest_framework import viewsets, permissions, parsers
from django_filters.rest_framework import DjangoFilterBackend

from common.mixins import OrgScopedViewSetMixin
from .models import Tenant, TenantDocument
from .serializers import TenantSerializer, TenantDocumentSerializer


class TenantViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "tenant_type", "kyc_verified"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]


class TenantDocumentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = TenantDocument.objects.all()
    serializer_class = TenantDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tenant"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
