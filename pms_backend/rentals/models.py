"""
Rental Management models.

Rental Management handles the financial lifecycle of a Lease:

    Lease
      └── RentalAccount
            ├── Invoice
            │     └── Payment(s)
            ├── RentalAdjustment
            └── Deposit

A RentalAccount represents the rental relationship/account.
An Invoice represents a specific billing period.
A Payment represents money actually received against an invoice.

This separation allows:
- recurring invoices
- partial payments
- overdue tracking
- penalties
- discounts
- adjustments
- deposits
- reconciliation
- auditability
"""

from decimal import Decimal

from django.db import models
from django.utils import timezone

from common.models import OrgScopedModel
from leases.models import Lease


class RentalAccount(OrgScopedModel):
    """
    Financial rental account associated with a Lease.

    The physical/property/tenant information is intentionally derived
    through the Lease -> Unit -> Property hierarchy rather than being
    duplicated here.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        CLOSED = "closed", "Closed"

    class RentType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        PARKING = "parking", "Parking"
        STORAGE = "storage", "Storage"

    lease = models.OneToOneField(
        Lease,
        on_delete=models.PROTECT,
        related_name="rental_account",
    )

    rental_account_number = models.CharField(
        max_length=64,
        unique=True,
    )

    rent_type = models.CharField(
        max_length=32,
        choices=RentType.choices,
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    # Financial configuration inherited from / agreed under the lease
    billing_frequency = models.CharField(
        max_length=32,
        default="monthly",
    )

    rent_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    service_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    parking_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    utility_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    internet_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    other_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    # Discount / escalation configuration
    default_discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    rent_escalation_applied = models.BooleanField(
        default=False,
    )

    escalation_percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Late payment configuration
    grace_period_days = models.PositiveIntegerField(
        default=0,
    )

    late_payment_penalty_percent = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    late_interest_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Late interest rate per month.",
    )

    # Accounting
    gl_account = models.CharField(
        max_length=255,
        blank=True,
    )

    cost_center = models.CharField(
        max_length=255,
        blank=True,
    )

    financial_posting_status = models.CharField(
        max_length=32,
        default="not_posted",
    )

    class Meta:
        ordering = ["rental_account_number"]
        unique_together = ("organization", "rental_account_number")

    def __str__(self):
        return self.rental_account_number

    @property
    def outstanding_balance(self):
        return sum(
            (
                invoice.outstanding_balance
                for invoice in self.invoices.exclude(
                    status=Invoice.Status.CANCELLED
                )
            ),
            Decimal("0.00"),
        )


class Invoice(OrgScopedModel):
    """
    One billing transaction for one rental billing period.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ISSUED = "issued", "Issued"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    rental_account = models.ForeignKey(
        RentalAccount,
        on_delete=models.PROTECT,
        related_name="invoices",
    )    
      
    
    # Convenience relationship back to Lease.
    # This is not a duplicate stored lease field.
    
    invoice_number = models.CharField(max_length=64)

    invoice_date = models.DateField(default=timezone.localdate)

    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    due_date = models.DateField()

    # Charges
    base_rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    service_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    parking_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    utility_charges = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    internet_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    other_charges = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_vat = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    late_payment_penalty = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    interest_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    # Accounting
    gl_account = models.CharField(
        max_length=255,
        blank=True,
    )

    cost_center = models.CharField(
        max_length=255,
        blank=True,
    )

    financial_posting_status = models.CharField(
        max_length=32,
        default="not_posted",
    )

    class Meta:
        ordering = ["-billing_period_start"]
        unique_together = ("organization", "invoice_number")

    def __str__(self):
        return self.invoice_number

    @property
    def amount_paid(self):
        return sum(
            (payment.amount for payment in self.payments.all()),
            Decimal("0.00"),
        )

    @property
    def outstanding_balance(self):
        balance = self.total_amount - self.amount_paid
        return max(balance, Decimal("0.00"))


class Payment(OrgScopedModel):
    """
    Actual money received against an invoice.

    Multiple Payment records can reference one Invoice, allowing
    partial payments.
    """

    class Method(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        CASH = "cash", "Cash"
        CARD = "card", "Card"

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    method = models.CharField(
        max_length=32,
        choices=Method.choices,
    )

    paid_at = models.DateTimeField()

    transaction_reference = models.CharField(
        max_length=128,
        blank=True,
    )

    receipt_number = models.CharField(
        max_length=64,
        blank=True,
    )

    class Meta:
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.amount}"


class RentalAdjustment(OrgScopedModel):
    """
    Discounts, increases, corrections and other rental adjustments.
    """

    class AdjustmentType(models.TextChoices):
        DISCOUNT = "discount", "Discount"
        INCREASE = "increase", "Increase"
        DECREASE = "decrease", "Decrease"
        ESCALATION = "escalation", "Escalation"
        CORRECTION = "correction", "Correction"

    rental_account = models.ForeignKey(
        RentalAccount,
        on_delete=models.PROTECT,
        related_name="adjustments",
    )

    adjustment_type = models.CharField(
        max_length=32,
        choices=AdjustmentType.choices,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )

    effective_date = models.DateField()

    reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-effective_date"]


class Deposit(OrgScopedModel):
    """
    Security deposit lifecycle.
    """

    class RefundStatus(models.TextChoices):
        NOT_APPLICABLE = "not_applicable", "Not Applicable"
        PENDING = "pending", "Pending"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially Refunded"
        REFUNDED = "refunded", "Refunded"

    rental_account = models.OneToOneField(
        RentalAccount,
        on_delete=models.PROTECT,
        related_name="deposit",
    )

    security_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    deposit_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    refund_status = models.CharField(
        max_length=32,
        choices=RefundStatus.choices,
        default=RefundStatus.NOT_APPLICABLE,
    )

    refunded_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    refund_date = models.DateField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]