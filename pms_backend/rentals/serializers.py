from rest_framework import serializers
from .models import Invoice, Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "invoice", "amount", "method", "paid_at", "transaction_reference"]
        read_only_fields = ["id"]


class InvoiceSerializer(serializers.ModelSerializer):
    amount_paid = serializers.ReadOnlyField()
    outstanding_balance = serializers.ReadOnlyField()
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "lease", "invoice_number", "billing_period_start", "billing_period_end",
            "due_date", "base_rent", "service_charge", "other_charges", "total_amount",
            "status", "amount_paid", "outstanding_balance", "payments", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
