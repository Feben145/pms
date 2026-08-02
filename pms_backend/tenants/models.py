"""
Tenant model -- Tenant Management spec.

Lease Information (property/building/floor/unit, lease dates, move-in/
move-out) and current rent/deposit are deliberately NOT stored here --
a tenant can have multiple leases over time, and the Lease record is
the real source of truth for who's renting what right now. See
TenantSerializer for how these are derived. Same for Outstanding
Balance: computed live from unpaid invoices, never stored.
"""

from django.db import models

from common.models import OrgScopedModel


class Tenant(OrgScopedModel):
    class TenantType(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        COMPANY = "company", "Company"

    class Status(models.TextChoices):
        PROSPECT = "prospect", "Prospect"
        APPLICATION_SUBMITTED = "application_submitted", "Application Submitted"
        KYC_VERIFICATION = "kyc_verification", "KYC Verification"
        APPROVED = "approved", "Approved"
        LEASE_SIGNED = "lease_signed", "Lease Signed"
        ACTIVE_TENANT = "active_tenant", "Active Tenant"
        LEASE_RENEWAL = "lease_renewal", "Lease Renewal"
        MOVE_OUT = "move_out", "Move-Out"
        FORMER_TENANT = "former_tenant", "Former Tenant"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    class ContactMethod(models.TextChoices):
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"
        PHONE = "phone", "Phone"

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        CASH = "cash", "Cash"

    class Language(models.TextChoices):
        ENGLISH = "english", "English"
        AMHARIC = "amharic", "Amharic"

    class CreditCheckStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PASSED = "passed", "Passed"
        FAILED = "failed", "Failed"

    class BackgroundCheckStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        CLEARED = "cleared", "Cleared"
        FLAGGED = "flagged", "Flagged"

    # -- Identification --
    tenant_code = models.CharField(max_length=32, blank=True, help_text="e.g. 'TNT-1001'.")
    tenant_type = models.CharField(max_length=16, choices=TenantType.choices, default=TenantType.INDIVIDUAL)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PROSPECT)

    # -- Personal Information (individuals) --
    first_name = models.CharField(max_length=100, blank=True)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(
        max_length=255, blank=True,
        help_text="Full legal name (individual) or company name. Auto-filled from name parts / company name if left blank.",
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=8, choices=Gender.choices, blank=True)
    nationality = models.CharField(max_length=100, default="Ethiopian", blank=True)
    national_id_or_business_reg = models.CharField(
        max_length=64, blank=True, help_text="National ID / Passport No. for individuals."
    )
    tax_identification_number = models.CharField(max_length=64, blank=True, help_text="TIN.")

    # -- Company Information (business tenants) --
    company_name = models.CharField(max_length=255, blank=True)
    business_registration_no = models.CharField(max_length=64, blank=True)
    business_license_no = models.CharField(max_length=64, blank=True)
    vat_registration_no = models.CharField(max_length=64, blank=True)
    contact_person = models.CharField(max_length=255, blank=True, help_text="Company representative.")

    # -- Contact Information --
    phone_number = models.CharField(max_length=32, help_text="Mobile number.")
    alternate_phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    preferred_contact_method = models.CharField(max_length=8, choices=ContactMethod.choices, blank=True)

    # -- Address Information --
    current_address = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=100, default="Ethiopia")
    region = models.CharField(max_length=100, blank=True)
    sub_city = models.CharField(max_length=100, blank=True)
    woreda = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    # -- Financial Information (tenant-level preferences; rent/deposit
    #    itself lives on the Lease and is derived, not duplicated here) --
    preferred_payment_method = models.CharField(max_length=16, choices=PaymentMethod.choices, blank=True)
    bank_name = models.CharField(max_length=255, blank=True)
    bank_account_number = models.CharField(max_length=64, blank=True)

    # -- Emergency Contact --
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=32, blank=True)

    # -- Preferences --
    preferred_language = models.CharField(max_length=16, choices=Language.choices, blank=True)
    accessibility_requirements = models.CharField(max_length=255, blank=True)

    # -- Compliance --
    kyc_verified = models.BooleanField(default=False, help_text="KYC Verification Status: Pending / Verified.")
    credit_check_status = models.CharField(max_length=16, choices=CreditCheckStatus.choices, blank=True)
    background_check_status = models.CharField(max_length=16, choices=BackgroundCheckStatus.choices, blank=True)
    blacklist_status = models.BooleanField(default=False)

    # -- Approval & Workflow --
    # Not user-editable via the form -- set only by the `approve` action
    # on TenantViewSet, which also stamps approved_by/approval_date.
    approved_by = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="approved_tenants"
    )
    approval_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["full_name"]

    def save(self, *args, **kwargs):
        # Auto-derive full_name if left blank, so every other module that
        # displays tenant.full_name (Lease, Invoice, ...) always has
        # something sensible without duplicating name-entry logic there.
        if not self.full_name:
            if self.tenant_type == self.TenantType.COMPANY and self.company_name:
                self.full_name = self.company_name
            else:
                self.full_name = " ".join(
                    part for part in [self.first_name, self.middle_name, self.last_name] if part
                )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name or f"Tenant #{self.pk}"


class TenantDocument(OrgScopedModel):
    """ID copy, passport, lease agreement, business license, proof of address."""

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255, help_text="Display name, e.g. 'ID Copy'.")
    file = models.FileField(upload_to="tenants/documents/")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name