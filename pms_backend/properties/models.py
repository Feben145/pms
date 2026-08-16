"""
Property hierarchy: Property -> Building -> Floor -> Unit.

This mirrors FR-001 to FR-004 in the requirements spec. Each level
inherits OrgScopedModel, so every row is automatically tied back to the
Organization that owns it -- there is no way to create a Building
without an Organization, because the field is required.

Field lists here cover the Phase 1 "core" fields called out in the
spec's data tables. Fields marked optional in the spec (e.g. detailed
utility meter numbers) are deferred to Phase 2 rather than added now,
to keep the MVP schema lean -- see docs/ARCHITECTURE.md for the phased
field-addition rationale.
"""

from django.db import models

from common.models import OrgScopedModel


class Property(OrgScopedModel):
    class PropertyType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        MIXED_USE = "mixed_use", "Mixed-use"
        INDUSTRIAL = "industrial", "Industrial"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PLANNED = "planned", "Planned"
        UNDER_CONSTRUCTION = "under_construction", "Under Construction"
        READY_FOR_OCCUPANCY = "ready_for_occupancy", "Ready for Occupancy"
        ACTIVE = "active", "Active"
        PARTIALLY_OCCUPIED = "partially_occupied", "Partially Occupied"
        FULLY_OCCUPIED = "fully_occupied", "Fully Occupied"
        UNDER_RENOVATION = "under_renovation", "Under Renovation"
        INACTIVE = "inactive", "Inactive"
        CLOSED = "closed", "Closed"
        SOLD = "sold", "Sold"
        DECOMMISSIONED = "decommissioned", "Decommissioned"

    class OperationalStatus(models.TextChoices):
        OPERATIONAL = "operational", "Operational"
        UNDER_RENOVATION = "under_renovation", "Under Renovation"
        CLOSED = "closed", "Closed"

    class Condition(models.TextChoices):
        EXCELLENT = "excellent", "Excellent"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"

    class OwnershipType(models.TextChoices):
        OWNED = "owned", "Owned"
        LEASED = "leased", "Leased"
        MANAGED = "managed", "Managed"

    # -- General Information --
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, help_text="Internal short code, e.g. PR001")
    property_type = models.CharField(max_length=32, choices=PropertyType.choices)
    property_category = models.CharField(
        max_length=100, blank=True,
        help_text="Free-text classification, e.g. 'Office Building', 'Apartment Complex'.",
    )
    ownership_type = models.CharField(max_length=16, choices=OwnershipType.choices, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    operational_status = models.CharField(
        max_length=32, choices=OperationalStatus.choices,
        default=OperationalStatus.OPERATIONAL,
    )
    year_built = models.PositiveIntegerField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="properties/images/", null=True, blank=True)

    # -- Ownership Information --
    owner_name = models.CharField(max_length=255, blank=True)
    managing_company = models.CharField(max_length=255, blank=True)
    property_manager = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="managed_properties"
    )

    # -- Location Information --
    country = models.CharField(max_length=100, default="Ethiopia")
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    sub_city = models.CharField(max_length=100, blank=True)
    zone = models.CharField(max_length=100, blank=True, help_text="Woreda / Zone.")
    address = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # -- Property Details (Characteristics + Operational) --
    total_land_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    gross_floor_area_sqm = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Built-up area (sqm).",
    )
    number_of_buildings = models.PositiveIntegerField(null=True, blank=True)
    number_of_floors = models.PositiveIntegerField(null=True, blank=True)
    number_of_units = models.PositiveIntegerField(null=True, blank=True)

    #parking details
    
    parking_capacity = models.PositiveIntegerField(null=True, blank=True, help_text="Total parking spaces available across the property.")
    covered_parking_spaces = models.PositiveIntegerField(null=True, blank=True, help_text="Number of covered parking spaces.")
    open_parking_spaces = models.PositiveIntegerField(
    null=True, blank=True, help_text="Number of open/outdoor parking spaces.")
    visitor_parking_spaces = models.PositiveIntegerField(null=True, blank=True, help_text="Parking spaces reserved for visitors.")
    accessible_parking_spaces = models.PositiveIntegerField(null=True, blank=True, help_text="Accessible parking spaces.")
    parking_notes = models.TextField(blank=True,help_text="Additional parking information, restrictions, or arrangements.")
    property_condition = models.CharField(
        max_length=16, choices=Condition.choices, blank=True, help_text="Maintenance status.",
    )
    energy_rating = models.CharField(max_length=4, blank=True, help_text="e.g. 'A', 'B+'.")
    facility_manager = models.CharField(max_length=255, blank=True)
    maintenance_provider = models.CharField(max_length=255, blank=True)
    security_provider = models.CharField(max_length=255, blank=True, help_text="Security service.")

    # -- Utilities & Facilities --
    water_connection = models.BooleanField(default=False)
    electricity_connection = models.BooleanField(default=False)
    internet_provider = models.CharField(max_length=100, blank=True)
    backup_generator = models.BooleanField(default=False)
    elevator_count = models.PositiveIntegerField(null=True, blank=True)
    fire_protection_system = models.BooleanField(default=False)
    cctv_installed = models.BooleanField(default=False)

    # -- Financial Information --
    property_value = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="ETB")
    monthly_rental_income = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    annual_operating_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    tax_registration_number = models.CharField(max_length=64, blank=True)
    vat_applicable = models.BooleanField(default=False)

    # -- Documents (reference numbers; actual files live in PropertyDocument) --
    title_deed_number = models.CharField(max_length=64, blank=True)
    insurance_policy_number = models.CharField(max_length=64, blank=True)
    insurance_expiry_date = models.DateField(null=True, blank=True)
    occupancy_permit_number = models.CharField(max_length=64, blank=True)

    # -- Operational --
    last_inspection_date = models.DateField(null=True, blank=True)
    next_inspection_date = models.DateField(null=True, blank=True)

    # -- Notes --
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("organization", "code")
        ordering = ["name"]
        verbose_name_plural = "Properties"

    def __str__(self):
        return self.name


class PropertyDocument(OrgScopedModel):
    """
    Supports the wizard's "Documents" tab: title deeds, insurance
    certificates, occupancy permits, etc. Kept as its own model
    (rather than fixed fields on Property) since the spec's document
    list is open-ended and a property may have any number of files.
    """

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255, help_text="Display name, e.g. 'Title Deed'.")
    file = models.FileField(upload_to="properties/documents/")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Building(OrgScopedModel):
    """
    Sits between Property and Floor. Occupancy figures (occupied/vacant
    units, occupancy rate) are deliberately NOT stored here -- per the
    aggregation principle used across this hierarchy, they're computed
    live from the actual Unit records beneath this building (see
    BuildingSerializer), so they can never drift out of sync with
    reality the way a manually-entered figure could.
    """

    class BuildingType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        OFFICE = "office", "Office"
        MIXED_USE = "mixed_use", "Mixed-use"
        WAREHOUSE = "warehouse", "Warehouse"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        UNDER_CONSTRUCTION = "under_construction", "Under Construction"
        UNDER_MAINTENANCE = "under_maintenance", "Under Maintenance"
        CLOSED = "closed", "Closed"

    class Condition(models.TextChoices):
        EXCELLENT = "excellent", "Excellent"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"

    class MaintenanceSchedule(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        ANNUALLY = "annually", "Annually"

    # -- Identification --
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="buildings")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32)
    building_type = models.CharField(max_length=32, choices=BuildingType.choices, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.ACTIVE)

    # -- Location --
    block_wing = models.CharField(max_length=100, blank=True)
    street_address = models.CharField(max_length=255, blank=True)
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # -- Structure --
    number_of_floors = models.PositiveIntegerField(default=1)
    number_of_basement_floors = models.PositiveIntegerField(default=0)
    total_floor_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rentable_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    building_height_meters = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    construction_year = models.PositiveIntegerField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)

    # -- Facilities --
    number_of_elevators = models.PositiveIntegerField(default=0)
    parking_capacity = models.PositiveIntegerField(null=True, blank=True)
    generator_available = models.BooleanField(default=False)
    water_supply = models.CharField(max_length=100, blank=True, help_text="e.g. 'Municipal', 'Borehole'.")
    fire_protection_system = models.BooleanField(default=False)
    cctv_coverage = models.CharField(
        max_length=100, blank=True, help_text="e.g. 'Full Coverage', 'Partial', 'None'."
    )
    security_service = models.CharField(max_length=255, blank=True)
    access_control = models.CharField(max_length=100, blank=True, help_text="e.g. 'RFID Card', 'Keypad'.")
    reception_available = models.BooleanField(default=False)
    emergency_exits = models.PositiveIntegerField(null=True, blank=True)

    # -- Maintenance --
    building_condition = models.CharField(max_length=16, choices=Condition.choices, blank=True)
    last_inspection_date = models.DateField(null=True, blank=True)
    next_inspection_date = models.DateField(null=True, blank=True)
    maintenance_schedule = models.CharField(max_length=16, choices=MaintenanceSchedule.choices, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)

    # -- Utilities --
    main_electricity_meter = models.CharField(max_length=64, blank=True)
    main_water_meter = models.CharField(max_length=64, blank=True)
    internet_provider = models.CharField(max_length=100, blank=True)
    hvac_system = models.CharField(max_length=100, blank=True)

    # -- Management --
    building_manager = models.CharField(max_length=255, blank=True)
    maintenance_supervisor = models.CharField(max_length=255, blank=True)
    cleaning_contractor = models.CharField(max_length=255, blank=True)

    # -- Documents (reference numbers; files live in BuildingDocument) --
    building_permit_number = models.CharField(max_length=64, blank=True)
    occupancy_certificate = models.CharField(max_length=64, blank=True)
    insurance_policy_number = models.CharField(max_length=64, blank=True)
    architectural_drawing_reference = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("organization", "property", "code")
        ordering = ["name"]

    def __str__(self):
        return f"{self.property.name} / {self.name}"


class BuildingDocument(OrgScopedModel):
    """Supporting files for a building: permits, insurance, drawings."""

    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255, help_text="Display name, e.g. 'Building Permit'.")
    file = models.FileField(upload_to="buildings/documents/")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Floor(OrgScopedModel):
    """
    Occupied/vacant/total unit counts are computed live from the actual
    Unit records beneath this floor (see FloorSerializer) -- same
    aggregation principle as Building and Property, for the same reason:
    a stored count can silently drift from reality; a computed one can't.
    """

    class FloorType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        PARKING = "parking", "Parking"
        OFFICE = "office", "Office"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        UNDER_MAINTENANCE = "under_maintenance", "Under Maintenance"
        CLOSED = "closed", "Closed"

    class CleaningSchedule(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"

    # -- Identification --
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="floors")
    code = models.CharField(max_length=32, blank=True, help_text="e.g. 'F01'.")
    name = models.CharField(max_length=100, help_text="e.g. 'Ground Floor', '5th Floor'")
    floor_number = models.IntegerField(help_text="Numeric level; can be negative for basements.")
    floor_type = models.CharField(max_length=32, choices=FloorType.choices, default=FloorType.RESIDENTIAL)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.ACTIVE)

    # -- Structure --
    total_area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rentable_area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    common_area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # -- Safety & Access --
    accessibility_features = models.CharField(max_length=255, blank=True, help_text="e.g. 'Wheelchair Access, Elevator'.")
    emergency_exit_count = models.PositiveIntegerField(null=True, blank=True)
    fire_safety_equipment = models.CharField(max_length=255, blank=True, help_text="e.g. 'Smoke Detectors, Fire Extinguishers'.")

    # -- Utilities & Maintenance --
    utility_meter_id = models.CharField(max_length=64, blank=True)
    next_maintenance_date = models.DateField(null=True, blank=True)
    cleaning_schedule = models.CharField(max_length=16, choices=CleaningSchedule.choices, blank=True)

    # -- Management --
    floor_manager = models.CharField(max_length=255, blank=True)
    security_zone = models.CharField(max_length=100, blank=True)
    cctv_coverage = models.BooleanField(default=False)

    remarks = models.TextField(blank=True)

    class Meta:
        unique_together = ("organization", "building", "floor_number")
        ordering = ["floor_number"]

    def __str__(self):
        return f"{self.building} / {self.name}"


class Unit(OrgScopedModel):
    """
    Occupancy details (current tenant, active lease, lease dates) are
    deliberately NOT stored here -- they're derived from the real Lease
    record (see UnitSerializer), since a Unit can have many leases over
    its lifetime and the Lease is the actual source of truth for who's
    there now.
    """

    class UnitType(models.TextChoices):
        APARTMENT = "apartment", "Apartment"
        OFFICE = "office", "Office"
        SHOP = "shop", "Shop"
        WAREHOUSE = "warehouse", "Warehouse"
        VILLA = "villa", "Villa"
        HOTEL_ROOM = "hotel_room", "Hotel Room"
        PARKING = "parking", "Parking"

    class UnitStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        VACANT = "vacant", "Vacant"
        RESERVED = "reserved", "Reserved"
        LEASED = "leased", "Leased / Occupied"
        EXPIRING = "expiring", "Expiring"
        UNDER_MAINTENANCE = "under_maintenance", "Under Maintenance / Cleaning"
        BLOCKED = "blocked", "Blocked"

    class UnitCategory(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        INDUSTRIAL = "industrial", "Industrial"
        MIXED_USE = "mixed_use", "Mixed-use"

    class UsageType(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        RETAIL = "retail", "Retail"
        OFFICE = "office", "Office"
        STORAGE = "storage", "Storage"

    class OwnershipType(models.TextChoices):
        OWNED = "owned", "Owned"
        LEASED = "leased", "Leased"
        RENTED = "rented", "Rented"

    class UtilityBillingMethod(models.TextChoices):
        METERED = "metered", "Metered"
        FIXED_RATE = "fixed_rate", "Fixed Rate"
        INCLUDED = "included", "Included"

    class Condition(models.TextChoices):
        EXCELLENT = "excellent", "Excellent"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"

    # -- Identification --
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name="units")
    unit_number = models.CharField(max_length=32, help_text="e.g. 'A-101'")
    unit_name = models.CharField(max_length=100, blank=True, help_text="e.g. 'Apartment 101'.")

    # -- Classification --
    unit_type = models.CharField(max_length=32, choices=UnitType.choices)
    unit_category = models.CharField(max_length=16, choices=UnitCategory.choices, blank=True)
    usage_type = models.CharField(max_length=16, choices=UsageType.choices, blank=True)
    ownership_type = models.CharField(max_length=16, choices=OwnershipType.choices, blank=True)
    status = models.CharField(max_length=32, choices=UnitStatus.choices, default=UnitStatus.DRAFT)

    # -- Physical Details --
    area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rentable_area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    number_of_bedrooms = models.PositiveIntegerField(null=True, blank=True)
    number_of_bathrooms = models.PositiveIntegerField(null=True, blank=True)
    balcony = models.BooleanField(default=False)
    kitchen = models.BooleanField(default=False)
    parking_space = models.CharField(max_length=32, blank=True, help_text="e.g. 'P-101'.")
    storage_room = models.CharField(max_length=32, blank=True)
    furnished = models.BooleanField(default=False)
    accessibility_features = models.CharField(max_length=255, blank=True)

    # -- Financial --
    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    utility_billing_method = models.CharField(max_length=16, choices=UtilityBillingMethod.choices, blank=True)
    vat_applicable = models.BooleanField(default=False)
    currency = models.CharField(max_length=8, default="ETB")

    # -- Utilities --
    electricity_meter_number = models.CharField(max_length=64, blank=True)
    water_meter_number = models.CharField(max_length=64, blank=True)
    gas_meter_number = models.CharField(max_length=64, blank=True)
    internet_connection = models.BooleanField(default=False)
    utility_account_number = models.CharField(max_length=64, blank=True)
    # Standard monthly utility charges configured for this unit -- the
    # actual dollar amounts, distinct from the meter/account metadata
    # above. A Lease reads these as read-only defaults rather than
    # having its own separate, easily-out-of-sync utility fields.
    electricity_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    water_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gas_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    internet_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    other_utility_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # -- Maintenance --
    maintenance_status = models.CharField(max_length=16, choices=Condition.choices, blank=True)
    last_inspection_date = models.DateField(null=True, blank=True)
    next_inspection_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)

    # -- Features & Amenities --
    air_conditioning = models.BooleanField(default=False)
    heating = models.BooleanField(default=False)
    smart_lock = models.BooleanField(default=False)
    smoke_detector = models.BooleanField(default=False)
    cctv_coverage = models.BooleanField(default=False)
    internet_ready = models.BooleanField(default=False)

    class Meta:
        unique_together = ("organization", "floor", "unit_number")
        ordering = ["unit_number"]

    def __str__(self):
        return f"{self.floor} / Unit {self.unit_number}"


class UnitDocument(OrgScopedModel):
    """Supporting files for a unit: floor plan, occupancy certificate, inspection report, photos."""

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255, help_text="Display name, e.g. 'Floor Plan'.")
    file = models.FileField(upload_to="units/documents/")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name