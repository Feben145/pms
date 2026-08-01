from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend

from common.mixins import OrgScopedViewSetMixin
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer


class InvoiceViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "lease"]


class PaymentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["invoice", "method"]
