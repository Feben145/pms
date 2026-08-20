from rest_framework import serializers

from .models import (
    RentalAccount,
    Invoice,
    Payment,
    RentalAdjustment,
    Deposit,
)


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(
        source="invoice.invoice_number",
        read_only=True,
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "invoice_number",
            "amount",
            "method",
            "paid_at",
            "transaction_reference",
            "receipt_number",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
        ]


class RentalAdjustmentSerializer(serializers.ModelSerializer):
    rental_account_number = serializers.CharField(
        source="rental_account.rental_account_number",
        read_only=True,
    )

    class Meta:
        model = RentalAdjustment
        fields = [
            "id",
            "rental_account",
            "rental_account_number",
            "adjustment_type",
            "amount",
            "percentage",
            "effective_date",
            "reason",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "rental_account_number",
            "created_at",
        ]


class DepositSerializer(serializers.ModelSerializer):
    rental_account_number = serializers.CharField(
        source="rental_account.rental_account_number",
        read_only=True,
    )

    class Meta:
        model = Deposit
        fields = [
            "id",
            "rental_account",
            "rental_account_number",
            "security_deposit",
            "deposit_balance",
            "refund_status",
            "refunded_amount",
            "refund_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "rental_account_number",
            "created_at",
            "updated_at",
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    amount_paid = serializers.ReadOnlyField()
    outstanding_balance = serializers.ReadOnlyField()

    payments = PaymentSerializer(
        many=True,
        read_only=True,
    )

    rental_account_number = serializers.CharField(
        source="rental_account.rental_account_number",
        read_only=True,
    )

    lease_id = serializers.IntegerField(
        source="rental_account.lease_id",
        read_only=True,
    )

    lease_number = serializers.CharField(
        source="rental_account.lease.lease_number",
        read_only=True,
    )

    tenant_id = serializers.IntegerField(
        source="rental_account.lease.tenant_id",
        read_only=True,
    )

    tenant_name = serializers.CharField(
        source="rental_account.lease.tenant.full_name",
        read_only=True,
    )

    unit_id = serializers.IntegerField(
        source="rental_account.lease.unit_id",
        read_only=True,
    )

    unit_number = serializers.CharField(
        source="rental_account.lease.unit.unit_number",
        read_only=True,
    )

    property_id = serializers.IntegerField(
        source="rental_account.lease.unit.floor.building.property_id",
        read_only=True,
    )

    property_name = serializers.CharField(
        source="rental_account.lease.unit.floor.building.property.name",
        read_only=True,
    )

    class Meta:
        model = Invoice

        fields = [
            "id",

            # Invoice identity
            "invoice_number",
            "invoice_date",

            # Rental relationship
            "rental_account",
            "rental_account_number",

            # Lease / tenant / property context
            "lease_id",
            "lease_number",
            "tenant_id",
            "tenant_name",
            "unit_id",
            "unit_number",
            "property_id",
            "property_name",

            # Billing period
            "billing_period_start",
            "billing_period_end",
            "due_date",

            # Charges
            "base_rent",
            "service_charge",
            "parking_fee",
            "utility_charges",
            "internet_fee",
            "other_charges",
            "discount",
            "tax_vat",
            "late_payment_penalty",
            "interest_amount",
            "total_amount",

            # Payment status
            "status",
            "amount_paid",
            "outstanding_balance",

            # Payments
            "payments",

            # Accounting
            "gl_account",
            "cost_center",
            "financial_posting_status",

            # Audit
            "created_at",
        ]

        read_only_fields = [
            "id",
            "amount_paid",
            "outstanding_balance",
            "created_at",
        ]


class RentalAccountSerializer(serializers.ModelSerializer):
    rental_id_display = serializers.SerializerMethodField()

    lease_number = serializers.CharField(
        source="lease.lease_number",
        read_only=True,
    )

    tenant_id = serializers.IntegerField(
        source="lease.tenant_id",
        read_only=True,
    )

    tenant_name = serializers.CharField(
        source="lease.tenant.full_name",
        read_only=True,
    )

    unit_id = serializers.IntegerField(
        source="lease.unit_id",
        read_only=True,
    )

    unit_number = serializers.CharField(
        source="lease.unit.unit_number",
        read_only=True,
    )

    property_id = serializers.IntegerField(
        source="lease.unit.floor.building.property_id",
        read_only=True,
    )

    property_name = serializers.CharField(
        source="lease.unit.floor.building.property.name",
        read_only=True,
    )

    outstanding_balance = serializers.ReadOnlyField()

    class Meta:
        model = RentalAccount

        fields = [
            "id",
            "rental_id_display",

            # Account
            "rental_account_number",

            # Lease
            "lease",
            "lease_number",

            # Tenant
            "tenant_id",
            "tenant_name",

            # Unit
            "unit_id",
            "unit_number",

            # Property
            "property_id",
            "property_name",

            # Rental configuration
            "rent_type",
            "status",
            "billing_frequency",

            # Charges
            "rent_amount",
            "service_charge",
            "parking_fee",
            "utility_charge",
            "internet_fee",
            "other_charge",

            # Discount / escalation
            "default_discount",
            "rent_escalation_applied",
            "escalation_percentage",

            # Late payment
            "grace_period_days",
            "late_payment_penalty_percent",
            "late_interest_rate",

            # Accounting
            "gl_account",
            "cost_center",
            "financial_posting_status",

            # Balance
            "outstanding_balance",

            # Audit
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "rental_id_display",
            "lease_number",
            "tenant_id",
            "tenant_name",
            "unit_id",
            "unit_number",
            "property_id",
            "property_name",
            "outstanding_balance",
            "created_at",
            "updated_at",
        ]

    def get_rental_id_display(self, obj):
        return f"RENT-{obj.id:04d}" if obj.id else None