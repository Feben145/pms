from rest_framework import serializers
from properties.models import Unit
from .models import Lease, LeaseDocument
from decimal import Decimal

# Lease statuses that mean "this unit is actually occupied by this
# lease" -- used both to block double-booking a unit and to decide
# when to flip the Unit's status back to vacant.
OCCUPYING_STATUSES = {Lease.Status.ACTIVE, Lease.Status.RENEWAL_PENDING}


class LeaseDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaseDocument
        fields = ["id", "lease", "name", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class LeaseSerializer(serializers.ModelSerializer):
    """
    Property/Building/Floor/Unit names and Tenant contact info are
    derived from the real `unit`/`tenant` foreign keys, not duplicated
    as stored fields -- same aggregation principle used throughout.
    Outstanding balance is computed from this lease's actual invoices.
    """

    documents = LeaseDocumentSerializer(many=True, read_only=True)
    lease_id_display = serializers.SerializerMethodField()
    property_id = serializers.IntegerField(source="unit.floor.building.property_id", read_only=True)
    property_name = serializers.CharField(source="unit.floor.building.property.name", read_only=True)
    building_id = serializers.IntegerField(source="unit.floor.building_id", read_only=True)
    building_name = serializers.CharField(source="unit.floor.building.name", read_only=True)
    floor_id = serializers.IntegerField(source="unit.floor_id", read_only=True)
    unit_number = serializers.CharField(source="unit.unit_number", read_only=True)
    tenant_name = serializers.CharField(source="tenant.full_name", read_only=True)
    tenant_contact_number = serializers.CharField(source="tenant.phone_number", read_only=True)
    tenant_email = serializers.CharField(source="tenant.email", read_only=True)
    tenant_type = serializers.CharField(source="tenant.tenant_type", read_only=True)
    # Utility metadata belongs to the Unit -- it's a property of the
    # physical space, not something re-entered per lease. Selecting a
    # unit in the wizard surfaces this automatically instead.
    unit_electricity_meter = serializers.CharField(source="unit.electricity_meter_number", read_only=True)
    unit_water_meter = serializers.CharField(source="unit.water_meter_number", read_only=True)
    unit_gas_meter = serializers.CharField(source="unit.gas_meter_number", read_only=True)
    unit_internet_connection = serializers.BooleanField(source="unit.internet_connection", read_only=True)
    unit_utility_account_number = serializers.CharField(source="unit.utility_account_number", read_only=True)
    unit_utility_billing_method = serializers.CharField(source="unit.utility_billing_method", read_only=True)
    unit_parking_space = serializers.CharField(source="unit.parking_space", read_only=True)
    lease_duration_days = serializers.SerializerMethodField()
    total_monthly_charge = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True, default=None)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = Lease
        fields = [
            "id", "lease_id_display", "unit", "tenant", "lease_number", "lease_version",
            "lease_type", "status",
            "property_id", "property_name", "building_id", "building_name", "floor_id", "unit_number",
            "tenant_name", "tenant_contact_number", "tenant_email", "tenant_type",
            "start_date", "end_date", "lease_duration_days", "move_in_date", "move_out_date",
            "renewal_notice_period_days",
            "monthly_rent", "security_deposit", "service_charge", "parking_fee",
            "unit_electricity_meter", "unit_water_meter", "unit_gas_meter",
            "unit_internet_connection", "unit_utility_account_number", "unit_utility_billing_method", "unit_parking_space",
            "currency", "billing_frequency", "payment_due_day",
            "rent_escalation_type", "rent_escalation_percent", "total_monthly_charge",
            "invoice_generation_term_type", "invoice_generation_day", "invoice_generation_relative_days",
            "payment_method", "bank_account",
            "late_payment_penalty_percent", "grace_period_days", "outstanding_balance",
            "approval_status", "approved_by", "approved_by_username", "approval_date",
            "digital_signature_status",
            "renewal_option", "renewal_period_months", "early_termination_allowed",
            "early_termination_notice_days", "maintenance_responsibility",
            "insurance_required", "subletting_allowed", "pet_policy",
            "documents",
            "created_at", "updated_at", "created_by", "updated_by",
            "created_by_username", "updated_by_username",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "created_by", "updated_by",
            "lease_version", "approval_status", "approved_by", "approval_date",
        ]

    def get_lease_id_display(self, obj):
        return f"LEA-{obj.id:04d}" if obj.id else None

    def get_lease_duration_days(self, obj):
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days
        return None

    def get_total_monthly_charge(self, obj):
        return (obj.monthly_rent or 0) + (obj.service_charge or 0) + (obj.parking_fee or 0)

    def get_outstanding_balance(self, obj):
        rental_account = getattr(obj, "rental_account", None)

        if rental_account is None:
            return Decimal("0.00")

        return rental_account.outstanding_balance

    def validate(self, data):
        start = data.get("start_date", getattr(self.instance, "start_date", None))
        end = data.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"end_date": "End date must be after the start date."})

        # Prevent double-booking: a unit that already has a lease in an
        # "occupying" state (active/renewal_pending) can't have a
        # SECOND lease attached at all -- regardless of what status
        # that second lease is being saved as. Every new lease starts
        # as Draft, so checking only "is the incoming status occupying"
        # would never catch this (a Draft never is) -- the real
        # question is whether the UNIT is already spoken for.
        unit = data.get("unit", getattr(self.instance, "unit", None))
        if unit:
            conflicting = Lease.objects.filter(
                unit=unit, status__in=OCCUPYING_STATUSES
            ).exclude(pk=getattr(self.instance, "pk", None))
            if conflicting.exists():
                raise serializers.ValidationError({
                    "unit": "This unit already has an active lease. Terminate or "
                            "let the existing lease expire before assigning a new one."
                })
        return data

    def create(self, validated_data):
        # Status is never taken from the create form -- every lease
        # starts as Draft. It only moves forward through workflow
        # actions (approve), never by directly setting the field.
        validated_data["status"] = Lease.Status.DRAFT
        lease = super().create(validated_data)
        self._sync_unit_status(lease)
        return lease

    def update(self, instance, validated_data):
        lease = super().update(instance, validated_data)
        self._sync_unit_status(lease)
        return lease

    def _sync_unit_status(self, lease: Lease):
        """
        Keep Unit.status consistent with what actually happened to its
        Lease, so the property hierarchy view doesn't silently drift out
        of sync with reality (e.g. a unit still showing "leased" after
        its lease was terminated).
        """
        unit = lease.unit
        if lease.status in OCCUPYING_STATUSES:
            new_status = Unit.UnitStatus.LEASED
        elif lease.status in {Lease.Status.TERMINATED, Lease.Status.EXPIRED}:
            # Only free the unit if no *other* lease is still occupying it.
            still_occupied = Lease.objects.filter(
                unit=unit, status__in=OCCUPYING_STATUSES
            ).exclude(pk=lease.pk).exists()
            new_status = Unit.UnitStatus.LEASED if still_occupied else Unit.UnitStatus.VACANT
        else:
            # Draft / pending approval: leave the unit's status alone --
            # it isn't actually occupied yet.
            return

        if unit.status != new_status:
            unit.status = new_status
            unit.save(update_fields=["status", "updated_at"])
            