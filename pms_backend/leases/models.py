"""
Lease model -- Lease-level contract, pricing, and billing configuration.

Architecture
------------
Property -> Building -> Floor -> Unit
                              |
                              +----> Lease
                                      |
                                      +----> Tenant

The Unit is the source of truth for the physical characteristics and
standard/default configuration of the space.

The Lease is the source of truth for the contractual terms and the
actual prices/charges applicable to a particular tenancy.

Therefore:

    Unit
    ----
    - physical unit information
    - area
    - bedrooms / bathrooms
    - parking-space reference
    - meter/account references
    - standard/default utility charges
    - standard unit currency
    - physical features

    Lease
    -----
    - tenant
    - lease dates
    - negotiated rent
    - negotiated security deposit
    - negotiated service charge
    - lease-level utility charges
    - parking fee for this lease
    - billing frequency
    - payment terms
    - escalation
    - penalties
    - contractual terms

IMPORTANT:
Lease pricing must NOT depend on mutable Unit pricing.

For example, if:

    Unit electricity_charge = 500 ETB

and a lease is signed with:

    Lease electricity_charge = 450 ETB

then the lease remains 450 ETB even if the Unit's standard
electricity charge is later changed to 600 ETB.

Likewise, parking_space belongs to the Unit because it identifies
the physical allocation/reference, while parking_fee belongs to the
Lease because the fee is a contractual/negotiated amount.

Unit configuration is exposed by LeaseSerializer as READ-ONLY
reference information. It is not duplicated as editable fields on
the Lease.
"""

from django.db import models

from common.models import OrgScopedModel
from properties.models import Unit
from tenants.models import Tenant


class Lease(OrgScopedModel):

    # ------------------------------------------------------------------
    # ENUMS / CHOICES
    # ------------------------------------------------------------------

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

    class InvoiceGenerationTermType(models.TextChoices):
        FIXED = "fixed", "Fixed day of month"
        RELATIVE = "relative", "Relative to due date"

    class BillingFrequency(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        ANNUALLY = "annually", "Annually"

    # ------------------------------------------------------------------
    # IDENTIFICATION
    # ------------------------------------------------------------------

    # The physical Unit being leased.
    #
    # Unit remains the source of truth for:
    #   - Property
    #   - Building
    #   - Floor
    #   - Unit number
    #   - Unit physical characteristics
    #
    # Lease does NOT duplicate those values.
    unit = models.ForeignKey(
        Unit,
        on_delete=models.PROTECT,
        related_name="leases",
    )

    # Tenant is the contractual occupant/customer.
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.PROTECT,
        related_name="leases",
    )

    lease_number = models.CharField(
        max_length=64,
        help_text="Human-readable contract number.",
    )

    lease_version = models.CharField(
        max_length=16,
        default="V1.0",
        editable=False,
        help_text=(
            "Auto-managed: V1.0 on creation, minor version bumps "
            "on every subsequent edit."
        ),
    )

    lease_type = models.CharField(
        max_length=16,
        choices=LeaseType.choices,
        blank=True,
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    # ------------------------------------------------------------------
    # LEASE DATES
    # ------------------------------------------------------------------

    start_date = models.DateField()

    end_date = models.DateField()

    move_in_date = models.DateField(
        null=True,
        blank=True,
    )

    move_out_date = models.DateField(
        null=True,
        blank=True,
    )

    renewal_notice_period_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------
    # LEASE-LEVEL PRICING
    # ------------------------------------------------------------------
    #
    # IMPORTANT DESIGN RULE:
    #
    # These values belong to the CONTRACT.
    #
    # They should NOT simply be read from Unit at billing time.
    #
    # Example:
    #
    # Unit monthly_rent = 25,000
    # Lease monthly_rent = 23,000
    #
    # The lease must remain 23,000 even if the Unit's standard rent
    # is later changed to 27,000.
    #
    # This allows negotiated pricing, discounts, promotions, renewals,
    # amendments, and historical billing to work correctly.
    # ------------------------------------------------------------------

    monthly_rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=(
            "Contractual monthly rent for this lease. "
            "This is independent from the Unit's standard/default rent."
        ),
    )

    security_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Security deposit agreed in this lease.",
    )

    service_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Contractual service charge for this lease. "
            "Independent from the Unit's standard service charge."
        ),
    )

    currency = models.CharField(
        max_length=8,
        default="ETB",
        help_text="Currency applicable to this lease's pricing.",
    )

    billing_frequency = models.CharField(
        max_length=16,
        choices=BillingFrequency.choices,
        default=BillingFrequency.MONTHLY,
        help_text="Payment frequency for lease charges.",
    )

    payment_due_day = models.PositiveSmallIntegerField(
        default=1,
        help_text="Day of the month rent is due.",
    )

    # ------------------------------------------------------------------
    # LEASE-LEVEL UTILITY PRICING
    # ------------------------------------------------------------------
    #
    # The Unit contains STANDARD/default utility charges.
    #
    # The Lease contains the ACTUAL contractual utility charges.
    #
    # Therefore the Lease can:
    #
    #   1. inherit/show Unit defaults when creating the lease;
    #   2. allow the user to override them;
    #   3. preserve the agreed values for the life of the lease.
    #
    # The frontend should display Unit utility configuration as
    # READ-ONLY reference information and Lease utility pricing as
    # editable contract-level configuration.
    # ------------------------------------------------------------------

    electricity_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Electricity charge applicable to this lease. "
            "May initially be populated from Unit's standard "
            "electricity_charge but is stored independently."
        ),
    )

    water_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Water charge applicable to this lease. "
            "May initially be populated from Unit's standard "
            "water_charge but is stored independently."
        ),
    )

    gas_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Gas charge applicable to this lease. "
            "May initially be populated from Unit's standard "
            "gas_charge but is stored independently."
        ),
    )

    internet_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Internet charge applicable to this lease. "
            "May initially be populated from Unit's standard "
            "internet_charge but is stored independently."
        ),
    )

    other_utility_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Other utility charge applicable to this lease."
        ),
    )

    # ------------------------------------------------------------------
    # PARKING
    # ------------------------------------------------------------------
    #
    # Parking has TWO different concepts:
    #
    # 1. Unit.parking_space
    #    -------------------
    #    Physical/reference information.
    #
    #    Example:
    #        P-101
    #
    #    This belongs to the Unit.
    #
    # 2. Lease.parking_fee
    #    -----------------
    #    Contractual price.
    #
    #    Example:
    #        1,500 ETB/month
    #
    #    This belongs to the Lease.
    #
    # Therefore:
    #
    # Unit:
    #     parking_space = "P-101"
    #
    # Lease:
    #     parking_fee = 1,500
    #
    # If the same Unit is leased to another tenant later with a
    # different parking price, the Unit does not need to change.
    # ------------------------------------------------------------------

    parking_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=(
            "Parking fee applicable to this lease. "
            "The physical parking-space reference comes from the Unit."
        ),
    )

    # ------------------------------------------------------------------
    # RENT ESCALATION
    # ------------------------------------------------------------------

    rent_escalation_type = models.CharField(
        max_length=16,
        choices=RentEscalationType.choices,
        blank=True,
    )

    rent_escalation_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------
    # BILLING & PAYMENT
    # ------------------------------------------------------------------

    invoice_generation_term_type = models.CharField(
        max_length=16,
        choices=InvoiceGenerationTermType.choices,
        default=InvoiceGenerationTermType.FIXED,
        help_text=(
            "Fixed: generate on a specific day each month. "
            "Relative: generate N days before the due date."
        ),
    )

    invoice_generation_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text=(
            "Used when term type is 'fixed': "
            "day of the month invoices are generated."
        ),
    )

    invoice_generation_relative_days = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text=(
            "Used when term type is 'relative': "
            "days before the due date to generate the invoice."
        ),
    )

    payment_method = models.CharField(
        max_length=16,
        choices=PaymentMethod.choices,
        blank=True,
    )

    bank_account = models.CharField(
        max_length=64,
        blank=True,
    )

    late_payment_penalty_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    grace_period_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------
    # APPROVAL & WORKFLOW
    # ------------------------------------------------------------------
    #
    # These fields are controlled by workflow actions, not ordinary
    # lease editing.
    # ------------------------------------------------------------------

    approval_status = models.CharField(
        max_length=16,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )

    approved_by = models.ForeignKey(
        "auth.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_leases",
    )

    approval_date = models.DateField(
        null=True,
        blank=True,
    )

    digital_signature_status = models.CharField(
        max_length=16,
        choices=SignatureStatus.choices,
        default=SignatureStatus.NOT_SIGNED,
    )

    # ------------------------------------------------------------------
    # TERMS & CONDITIONS
    # ------------------------------------------------------------------

    renewal_option = models.BooleanField(
        default=False,
    )

    renewal_period_months = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    early_termination_allowed = models.BooleanField(
        default=False,
    )

    early_termination_notice_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    maintenance_responsibility = models.CharField(
        max_length=16,
        choices=MaintenanceResponsibility.choices,
        blank=True,
    )

    insurance_required = models.BooleanField(
        default=False,
    )

    subletting_allowed = models.BooleanField(
        default=False,
    )

    pet_policy = models.CharField(
        max_length=16,
        choices=PetPolicy.choices,
        blank=True,
    )

    # ------------------------------------------------------------------
    # META
    # ------------------------------------------------------------------

    class Meta:
        unique_together = ("organization", "lease_number")
        ordering = ["-start_date"]

    # ------------------------------------------------------------------
    # SAVE
    # ------------------------------------------------------------------

    def save(self, *args, **kwargs):
        """
        Automatically maintain lease version.

        First creation:
            V1.0

        Subsequent edits:
            V1.1
            V1.2
            V1.3
            ...

        The frontend must never manually modify lease_version.
        """

        if self.pk is not None:
            try:
                major, minor = self.lease_version.lstrip("Vv").split(".")
                self.lease_version = f"V{major}.{int(minor) + 1}"
            except (ValueError, AttributeError):
                # Malformed existing value -- leave it unchanged rather
                # than attempting to guess the correct version.
                pass

        super().save(*args, **kwargs)

    # ------------------------------------------------------------------
    # STRING REPRESENTATION
    # ------------------------------------------------------------------

    def __str__(self):
        return f"{self.lease_number} ({self.tenant} / {self.unit})"


class LeaseDocument(OrgScopedModel):
    """
    Supporting files for a lease.

    Examples:
        - Lease Agreement
        - Amendment
        - Insurance Certificate
        - Inspection Report
        - Supporting Contract
    """

    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    name = models.CharField(
        max_length=255,
        help_text="Display name, e.g. 'Lease Agreement'.",
    )

    file = models.FileField(
        upload_to="leases/documents/",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
        