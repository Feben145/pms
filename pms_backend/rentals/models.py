"""
Rental/billing models -- FR-007 in the requirements spec.

Invoice and Payment are kept as separate models (rather than one
combined table) because a single invoice can be paid in multiple
partial payments -- the spec explicitly calls out "partial payments"
as a required behavior, so the schema needs to support many-Payments
to one-Invoice from the start.
"""

from django.db import models

from common.models import OrgScopedModel
from leases.models import Lease


class Invoice(OrgScopedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ISSUED = "issued", "Issued"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    lease = models.ForeignKey(Lease, on_delete=models.PROTECT, related_name="invoices")

    invoice_number = models.CharField(max_length=64)
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    due_date = models.DateField()

    base_rent = models.DecimalField(max_digits=12, decimal_places=2)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        unique_together = ("organization", "invoice_number")
        ordering = ["-billing_period_start"]

    def __str__(self):
        return self.invoice_number

    @property
    def amount_paid(self):
        return sum(p.amount for p in self.payments.all())

    @property
    def outstanding_balance(self):
        return self.total_amount - self.amount_paid


class Payment(OrgScopedModel):
    class Method(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        CASH = "cash", "Cash"
        CARD = "card", "Card"

    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=32, choices=Method.choices)
    paid_at = models.DateTimeField()
    transaction_reference = models.CharField(max_length=128, blank=True)

    class Meta:
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.amount}"
