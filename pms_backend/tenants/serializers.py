from rest_framework import serializers
from .models import Tenant, TenantDocument


class TenantDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantDocument
        fields = ["id", "tenant", "name", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class TenantSerializer(serializers.ModelSerializer):
    """
    Lease Information (property/building/floor/unit chain, lease dates,
    move-in/move-out) and Outstanding Balance are computed from the
    tenant's current active Lease and its Invoices -- never stored here.
    A tenant can have many leases over time; the active one (or, if none
    is active, the most recent) is what's shown.
    """

    documents = TenantDocumentSerializer(many=True, read_only=True)
    tenant_id_display = serializers.SerializerMethodField()
    current_property_name = serializers.SerializerMethodField()
    current_building_name = serializers.SerializerMethodField()
    current_floor_name = serializers.SerializerMethodField()
    current_unit_number = serializers.SerializerMethodField()
    current_lease_id = serializers.SerializerMethodField()
    current_lease_number = serializers.SerializerMethodField()
    lease_start_date = serializers.SerializerMethodField()
    lease_end_date = serializers.SerializerMethodField()
    move_in_date = serializers.SerializerMethodField()
    move_out_date = serializers.SerializerMethodField()
    current_monthly_rent = serializers.SerializerMethodField()
    current_security_deposit = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True, default=None)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = Tenant
        fields = [
            "id", "tenant_id_display", "tenant_code", "tenant_type", "status",
            "first_name", "middle_name", "last_name", "full_name",
            "date_of_birth", "gender", "nationality",
            "national_id_or_business_reg", "tax_identification_number",
            "company_name", "business_registration_no", "business_license_no",
            "vat_registration_no", "contact_person",
            "phone_number", "alternate_phone", "email", "preferred_contact_method",
            "current_address", "country", "region", "sub_city", "woreda", "postal_code",
            "preferred_payment_method", "bank_name", "bank_account_number",
            "current_property_name", "current_building_name", "current_floor_name",
            "current_unit_number", "current_lease_id", "current_lease_number",
            "lease_start_date", "lease_end_date", "move_in_date", "move_out_date",
            "current_monthly_rent", "current_security_deposit", "outstanding_balance",
            "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
            "preferred_language", "accessibility_requirements",
            "kyc_verified", "credit_check_status", "background_check_status", "blacklist_status",
            "approved_by", "approved_by_username", "approval_date",
            "documents",
            "created_at", "updated_at", "created_by", "updated_by",
            "created_by_username", "updated_by_username",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "created_by", "updated_by",
            "approved_by", "approval_date",
        ]

    def create(self, validated_data):
        # Status is never taken from the create form -- every tenant
        # starts as Prospect and only advances through workflow actions
        # (approve), never by directly setting the field.
        validated_data["status"] = Tenant.Status.PROSPECT
        return super().create(validated_data)

    def _current_lease(self, obj):
        if not hasattr(obj, "_current_lease_cache"):
            leases = obj.leases.select_related("unit__floor__building__property").order_by("-start_date")
            active = leases.filter(status__in=["active", "renewal_pending"]).first()
            obj._current_lease_cache = active or leases.first()
        return obj._current_lease_cache

    def get_tenant_id_display(self, obj):
        return f"TEN-{obj.id:04d}" if obj.id else None

    def get_current_property_name(self, obj):
        lease = self._current_lease(obj)
        return lease.unit.floor.building.property.name if lease else None

    def get_current_building_name(self, obj):
        lease = self._current_lease(obj)
        return lease.unit.floor.building.name if lease else None

    def get_current_floor_name(self, obj):
        lease = self._current_lease(obj)
        return lease.unit.floor.name if lease else None

    def get_current_unit_number(self, obj):
        lease = self._current_lease(obj)
        return lease.unit.unit_number if lease else None

    def get_current_lease_id(self, obj):
        lease = self._current_lease(obj)
        return lease.id if lease else None

    def get_current_lease_number(self, obj):
        lease = self._current_lease(obj)
        return lease.lease_number if lease else None

    def get_lease_start_date(self, obj):
        lease = self._current_lease(obj)
        return lease.start_date if lease else None

    def get_lease_end_date(self, obj):
        lease = self._current_lease(obj)
        return lease.end_date if lease else None

    def get_move_in_date(self, obj):
        lease = self._current_lease(obj)
        return lease.move_in_date if lease else None

    def get_move_out_date(self, obj):
        lease = self._current_lease(obj)
        return lease.move_out_date if lease else None

    def get_current_monthly_rent(self, obj):
        lease = self._current_lease(obj)
        return lease.monthly_rent if lease else None

    def get_current_security_deposit(self, obj):
        lease = self._current_lease(obj)
        return lease.security_deposit if lease else None

    def get_outstanding_balance(self, obj):
        from decimal import Decimal
        from rentals.models import Invoice
        invoices = Invoice.objects.filter(lease__tenant=obj).exclude(status="cancelled")
        return sum((inv.outstanding_balance for inv in invoices), Decimal("0"))
