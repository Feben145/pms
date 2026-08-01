"""
Lease model -- matches the original Lease Management spec.

Property/Building/Floor/Unit names and Tenant contact info are
deliberately NOT duplicated here -- they're derived from the real
`unit` and `tenant` foreign keys (see LeaseSerializer), same
aggregation principle used everywhere else in this app.
"""

from django.db import models

from common.models import OrgScopedModel
from properties.models import Unit
from tenants.models import Tenant


class Lease(OrgScopedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        AWAITING_SIGNATURE = "awaiting_signature", "Awaiting Signature"
        ACTIVE = "active", "Active"
        RENEWAL_PENDING = "renewal_pending", "Renewal Pending"
        RENEWED = "renewed", "Renewed"
        AMENDED = "amended", "Amended"
        SUSPENDED = "suspended", "Suspended"
        TERMINATED = "terminated", "Terminated"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    class LeaseType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        OFFICE = "office", "Office"
        WAREHOUSE = "warehouse", "Warehouse"

    class RentEscalationType(models.TextChoices):
        FIXED_PERCENT = "fixed_percent", "Fixed %"
        CPI_BASED = "cpi_based", "CPI-based"

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        CASH = "cash", "Cash"

    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class SignatureStatus(models.TextChoices):
        NOT_SIGNED = "not_signed", "Not Signed"
        SIGNED = "signed", "Signed"

    class MaintenanceResponsibility(models.TextChoices):
        TENANT = "tenant", "Tenant"
        LANDLORD = "landlord", "Landlord"

    class PetPolicy(models.TextChoices):
        ALLOWED = "allowed", "Allowed"
        NOT_ALLOWED = "not_allowed", "Not Allowed"
        CASE_BY_CASE = "case_by_case", "Case-by-case"

    # -- Identification --
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="leases")
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name="leases")
    lease_number = models.CharField(max_length=64, help_text="Human-readable contract number.")
    lease_version = models.CharField(max_length=16, default="V1.0")
    lease_type = models.CharField(max_length=16, choices=LeaseType.choices, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)

    # -- Lease Dates --
    start_date = models.DateField()
    end_date = models.DateField()
    move_in_date = models.DateField(null=True, blank=True)
    move_out_date = models.DateField(null=True, blank=True)
    renewal_notice_period_days = models.PositiveIntegerField(null=True, blank=True)

    # -- Financial Information --
    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    utility_charges = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    parking_fee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="ETB")
    billing_frequency = models.CharField(
        max_length=16,
        choices=[("monthly", "Monthly"), ("quarterly", "Quarterly"), ("annually", "Annually")],
        default="monthly",
        help_text="Payment frequency.",
    )
    payment_due_day = models.PositiveSmallIntegerField(default=1, help_text="Day of the month rent is due.")
    rent_escalation_type = models.CharField(max_length=16, choices=RentEscalationType.choices, blank=True)
    rent_escalation_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # -- Billing & Payment --
    invoice_generation_day = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Day of the month invoices are generated."
    )
    payment_method = models.CharField(max_length=16, choices=PaymentMethod.choices, blank=True)
    bank_account = models.CharField(max_length=64, blank=True)
    late_payment_penalty_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grace_period_days = models.PositiveIntegerField(null=True, blank=True)

    # -- Approval & Workflow --
    approval_status = models.CharField(max_length=16, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    approved_by = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="approved_leases"
    )
    approval_date = models.DateField(null=True, blank=True)
    digital_signature_status = models.CharField(
        max_length=16, choices=SignatureStatus.choices, default=SignatureStatus.NOT_SIGNED
    )

    # -- Terms & Conditions --
    renewal_option = models.BooleanField(default=False)
    renewal_period_months = models.PositiveIntegerField(null=True, blank=True)
    early_termination_allowed = models.BooleanField(default=False)
    early_termination_notice_days = models.PositiveIntegerField(null=True, blank=True)
    maintenance_responsibility = models.CharField(max_length=16, choices=MaintenanceResponsibility.choices, blank=True)
    insurance_required = models.BooleanField(default=False)
    subletting_allowed = models.BooleanField(default=False)
    pet_policy = models.CharField(max_length=16, choices=PetPolicy.choices, blank=True)

    class Meta:
        unique_together = ("organization", "lease_number")
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.lease_number} ({self.tenant} / {self.unit})"


class LeaseDocument(OrgScopedModel):
    """Lease agreement, amendments, insurance certificate, inspection report."""

    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255, help_text="Display name, e.g. 'Lease Agreement'.")
    file = models.FileField(upload_to="leases/documents/")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
