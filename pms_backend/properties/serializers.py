from rest_framework import serializers
from .models import Property, PropertyDocument, Building, BuildingDocument, Floor, Unit, UnitDocument


class PropertyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyDocument
        fields = ["id", "property", "name", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class PropertySerializer(serializers.ModelSerializer):
    documents = PropertyDocumentSerializer(many=True, read_only=True)
    property_id_display = serializers.SerializerMethodField()
    occupancy_rate = serializers.SerializerMethodField()
    vacancy_rate = serializers.SerializerMethodField()
    total_units_actual = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = Property
        fields = [
            "id", "property_id_display", "name", "code", "property_type", "property_category",
            "ownership_type", "status", "operational_status", "year_built", "completion_date",
            "description", "image",
            "owner_name", "managing_company", "property_manager",
            "country", "region", "city", "sub_city", "zone", "address", "postal_code",
            "gps_latitude", "gps_longitude",
            "total_land_area_sqm", "gross_floor_area_sqm",
            "number_of_buildings", "number_of_floors", "number_of_units", "total_units_actual",
            "parking_capacity", "property_condition", "energy_rating",
            "facility_manager", "maintenance_provider", "security_provider",
            "water_connection", "electricity_connection", "internet_provider",
            "backup_generator", "elevator_count", "fire_protection_system", "cctv_installed",
            "property_value", "currency", "monthly_rental_income", "annual_operating_cost",
            "tax_registration_number", "vat_applicable",
            "title_deed_number", "insurance_policy_number", "insurance_expiry_date", "occupancy_permit_number",
            "last_inspection_date", "next_inspection_date",
            "occupancy_rate", "vacancy_rate",
            "notes", "documents",
            "created_at", "updated_at", "created_by", "updated_by",
            "created_by_username", "updated_by_username",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def get_property_id_display(self, obj):
        return f"PROP-{obj.id:04d}" if obj.id else None

    def _unit_queryset(self, obj):
        return Unit.objects.filter(floor__building__property=obj)

    def get_total_units_actual(self, obj):
        """
        The real unit count from the hierarchy, distinct from the
        manually-entered `number_of_units` estimate captured at
        registration time (useful before buildings/units are added yet).
        """
        return self._unit_queryset(obj).count()

    def get_occupancy_rate(self, obj):
        units = self._unit_queryset(obj)
        total = units.count()
        if total == 0:
            return None
        leased = units.filter(status="leased").count()
        return round((leased / total) * 100, 1)

    def get_vacancy_rate(self, obj):
        rate = self.get_occupancy_rate(obj)
        return None if rate is None else round(100 - rate, 1)


class BuildingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingDocument
        fields = ["id", "building", "name", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class BuildingSerializer(serializers.ModelSerializer):
    documents = BuildingDocumentSerializer(many=True, read_only=True)
    building_id_display = serializers.SerializerMethodField()
    property_name = serializers.CharField(source="property.name", read_only=True)
    total_units = serializers.SerializerMethodField()
    residential_units = serializers.SerializerMethodField()
    commercial_units = serializers.SerializerMethodField()
    occupied_units = serializers.SerializerMethodField()
    vacant_units = serializers.SerializerMethodField()
    occupancy_rate = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = Building
        fields = [
            "id", "building_id_display", "property", "property_name", "name", "code",
            "building_type", "status",
            "block_wing", "street_address", "gps_latitude", "gps_longitude",
            "number_of_floors", "number_of_basement_floors",
            "total_units", "residential_units", "commercial_units",
            "total_floor_area_sqm", "rentable_area_sqm", "building_height_meters",
            "construction_year", "completion_date",
            "occupied_units", "vacant_units", "occupancy_rate",
            "number_of_elevators", "parking_capacity", "generator_available",
            "water_supply", "fire_protection_system", "cctv_coverage",
            "security_service", "access_control", "reception_available", "emergency_exits",
            "building_condition", "last_inspection_date", "next_inspection_date",
            "maintenance_schedule", "warranty_expiry",
            "main_electricity_meter", "main_water_meter", "internet_provider", "hvac_system",
            "building_manager", "maintenance_supervisor", "cleaning_contractor",
            "building_permit_number", "occupancy_certificate", "insurance_policy_number",
            "architectural_drawing_reference", "documents",
            "created_at", "updated_at", "created_by", "updated_by",
            "created_by_username", "updated_by_username",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def get_building_id_display(self, obj):
        return f"BLD-{obj.id:04d}" if obj.id else None

    def _unit_queryset(self, obj):
        return Unit.objects.filter(floor__building=obj)

    def get_total_units(self, obj):
        return self._unit_queryset(obj).count()

    def get_residential_units(self, obj):
        return self._unit_queryset(obj).filter(unit_type__in=["apartment"]).count()

    def get_commercial_units(self, obj):
        return self._unit_queryset(obj).filter(unit_type__in=["office", "shop", "warehouse"]).count()

    def get_occupied_units(self, obj):
        return self._unit_queryset(obj).filter(status="leased").count()

    def get_vacant_units(self, obj):
        return self._unit_queryset(obj).filter(status="vacant").count()

    def get_occupancy_rate(self, obj):
        total = self.get_total_units(obj)
        if total == 0:
            return None
        return round((self.get_occupied_units(obj) / total) * 100, 1)


class FloorSerializer(serializers.ModelSerializer):
    floor_id_display = serializers.SerializerMethodField()
    building_name = serializers.CharField(source="building.name", read_only=True)
    property_id = serializers.IntegerField(source="building.property_id", read_only=True)
    property_name = serializers.CharField(source="building.property.name", read_only=True)
    total_units = serializers.SerializerMethodField()
    occupied_units = serializers.SerializerMethodField()
    vacant_units = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = Floor
        fields = [
            "id", "floor_id_display", "code", "building", "building_name",
            "property_id", "property_name", "name", "floor_number", "floor_type", "status",
            "total_area_sqm", "rentable_area_sqm", "common_area_sqm",
            "total_units", "occupied_units", "vacant_units",
            "accessibility_features", "emergency_exit_count", "fire_safety_equipment",
            "utility_meter_id", "next_maintenance_date", "cleaning_schedule",
            "floor_manager", "security_zone", "cctv_coverage", "remarks",
            "created_at", "updated_at", "created_by", "updated_by",
            "created_by_username", "updated_by_username",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def get_floor_id_display(self, obj):
        return f"FLR-{obj.id:04d}" if obj.id else None

    def _unit_queryset(self, obj):
        return Unit.objects.filter(floor=obj)

    def get_total_units(self, obj):
        return self._unit_queryset(obj).count()

    def get_occupied_units(self, obj):
        return self._unit_queryset(obj).filter(status="leased").count()

    def get_vacant_units(self, obj):
        return self._unit_queryset(obj).filter(status="vacant").count()


class UnitDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitDocument
        fields = ["id", "unit", "name", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class UnitSerializer(serializers.ModelSerializer):
    documents = UnitDocumentSerializer(many=True, read_only=True)
    unit_id_display = serializers.SerializerMethodField()
    building_id = serializers.IntegerField(source="floor.building_id", read_only=True)
    property_id = serializers.IntegerField(source="floor.building.property_id", read_only=True)
    property_name = serializers.CharField(source="floor.building.property.name", read_only=True)
    building_name = serializers.CharField(source="floor.building.name", read_only=True)
    # Occupancy is derived from the real, current Lease -- not stored on
    # Unit -- since a unit has many leases over its life and the Lease
    # is the actual source of truth for who's there right now.
    current_tenant_id = serializers.SerializerMethodField()
    current_tenant_name = serializers.SerializerMethodField()
    current_lease_id = serializers.SerializerMethodField()
    lease_start_date = serializers.SerializerMethodField()
    lease_end_date = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = Unit
        fields = [
            "id", "unit_id_display", "floor", "building_id", "building_name",
            "property_id", "property_name",
            "unit_number", "unit_name",
            "unit_type", "unit_category", "usage_type", "ownership_type", "status",
            "area_sqm", "rentable_area_sqm", "number_of_bedrooms", "number_of_bathrooms",
            "balcony", "kitchen", "parking_space", "storage_room", "furnished", "accessibility_features",
            "monthly_rent", "security_deposit", "service_charge", "utility_billing_method",
            "vat_applicable", "currency",
            "current_tenant_id", "current_tenant_name", "current_lease_id", "lease_start_date", "lease_end_date",
            "electricity_meter_number", "water_meter_number", "gas_meter_number",
            "internet_connection", "utility_account_number",
            "maintenance_status", "last_inspection_date", "next_inspection_date", "warranty_expiry",
            "air_conditioning", "heating", "smart_lock", "smoke_detector", "cctv_coverage", "internet_ready",
            "documents",
            "created_at", "updated_at", "created_by", "updated_by",
            "created_by_username", "updated_by_username",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def get_unit_id_display(self, obj):
        return f"UNT-{obj.id:04d}" if obj.id else None

    def _active_lease(self, obj):
        from leases.models import Lease
        return Lease.objects.filter(
            unit=obj, status__in=["active", "renewal_pending"]
        ).select_related("tenant").first()

    def get_current_tenant_id(self, obj):
        lease = self._active_lease(obj)
        return lease.tenant_id if lease else None

    def get_current_tenant_name(self, obj):
        lease = self._active_lease(obj)
        return lease.tenant.full_name if lease else None

    def get_current_lease_id(self, obj):
        lease = self._active_lease(obj)
        return lease.id if lease else None

    def get_lease_start_date(self, obj):
        lease = self._active_lease(obj)
        return lease.start_date if lease else None

    def get_lease_end_date(self, obj):
        lease = self._active_lease(obj)
        return lease.end_date if lease else None
