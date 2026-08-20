from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from common.mixins import OrgScopedViewSetMixin

from .models import (
    RentalAccount,
    Invoice,
    Payment,
    RentalAdjustment,
    Deposit,
)

from .serializers import (
    RentalAccountSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    RentalAdjustmentSerializer,
    DepositSerializer,
)


class RentalAccountViewSet(
    OrgScopedViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = RentalAccount.objects.select_related(
        "lease",
        "lease__tenant",
        "lease__unit",
        "lease__unit__floor",
        "lease__unit__floor__building",
        "lease__unit__floor__building__property",
    )

    serializer_class = RentalAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "rent_type",
        "billing_frequency",
        "lease",
    ]

    search_fields = [
        "rental_account_number",
        "lease__lease_number",
        "lease__tenant__full_name",
        "lease__unit__unit_number",
        "lease__unit__floor__building__property__name",
    ]

    ordering_fields = [
        "rental_account_number",
        "rent_amount",
        "status",
        "created_at",
        "updated_at",
    ]

    ordering = ["rental_account_number"]


class InvoiceViewSet(
    OrgScopedViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Invoice.objects.select_related(
        "rental_account",
        "rental_account__lease",
        "rental_account__lease__tenant",
        "rental_account__lease__unit",
        "rental_account__lease__unit__floor",
        "rental_account__lease__unit__floor__building",
        "rental_account__lease__unit__floor__building__property",
    )

    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "rental_account",
        "due_date",
    ]

    search_fields = [
        "invoice_number",
        "rental_account__rental_account_number",
        "rental_account__lease__lease_number",
        "rental_account__lease__tenant__full_name",
    ]


class PaymentViewSet(
    OrgScopedViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Payment.objects.select_related(
        "invoice",
        "invoice__rental_account",
    )

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
    ]

    filterset_fields = [
        "invoice",
        "invoice__rental_account",
        "method",
    ]

    search_fields = [
        "transaction_reference",
        "receipt_number",
    ]


class RentalAdjustmentViewSet(
    OrgScopedViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = RentalAdjustment.objects.select_related(
        "rental_account",
    )

    serializer_class = RentalAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
    ]

    filterset_fields = [
        "rental_account",
        "adjustment_type",
    ]

    search_fields = [
        "reason",
    ]


class DepositViewSet(
    OrgScopedViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Deposit.objects.select_related(
        "rental_account",
        "rental_account__lease",
    )

    serializer_class = DepositSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
    ]

    filterset_fields = [
        "refund_status",
        "rental_account",
    ]