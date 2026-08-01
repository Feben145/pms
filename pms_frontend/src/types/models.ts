/**
 * TypeScript types mirroring the Django REST Framework serializers.
 * Keep these in sync with the backend's serializers.py files by hand
 * for now -- if the API grows much further, generating these from the
 * OpenAPI schema at /api/schema/ (via openapi-typescript) removes the
 * risk of drift and is worth introducing in Phase 2.
 */

export interface Property {
  id: number;
  property_id_display: string;
  name: string;
  code: string;
  property_type: "residential" | "commercial" | "mixed_use" | "industrial";
  property_category: string;
  ownership_type: "owned" | "leased" | "managed" | "";
  status:
    | "draft" | "planned" | "under_construction" | "ready_for_occupancy" | "active"
    | "partially_occupied" | "fully_occupied" | "under_renovation" | "inactive"
    | "closed" | "sold" | "decommissioned";
  operational_status: "operational" | "under_renovation" | "closed";
  year_built: number | null;
  completion_date: string | null;
  description: string;
  image: string | null;
  owner_name: string;
  managing_company: string;
  property_manager: number | null;
  country: string;
  region: string;
  city: string;
  sub_city: string;
  zone: string;
  address: string;
  postal_code: string;
  gps_latitude: string | null;
  gps_longitude: string | null;
  total_land_area_sqm: string | null;
  gross_floor_area_sqm: string | null;
  number_of_buildings: number | null;
  number_of_floors: number | null;
  number_of_units: number | null;
  total_units_actual: number;
  parking_capacity: number | null;
  property_condition: "excellent" | "good" | "fair" | "poor" | "";
  energy_rating: string;
  facility_manager: string;
  maintenance_provider: string;
  security_provider: string;
  water_connection: boolean;
  electricity_connection: boolean;
  internet_provider: string;
  backup_generator: boolean;
  elevator_count: number | null;
  fire_protection_system: boolean;
  cctv_installed: boolean;
  property_value: string | null;
  currency: string;
  monthly_rental_income: string | null;
  annual_operating_cost: string | null;
  tax_registration_number: string;
  vat_applicable: boolean;
  title_deed_number: string;
  insurance_policy_number: string;
  insurance_expiry_date: string | null;
  occupancy_permit_number: string;
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  occupancy_rate: number | null;
  vacancy_rate: number | null;
  notes: string;
  documents: PropertyDocument[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_by_username: string | null;
  updated_by_username: string | null;
}

export interface PropertyDocument {
  id: number;
  property: number;
  name: string;
  file: string;
  created_at: string;
}

export interface Building {
  id: number;
  building_id_display: string;
  property: number;
  property_name: string;
  name: string;
  code: string;
  building_type: "residential" | "commercial" | "office" | "mixed_use" | "warehouse" | "";
  status: "active" | "under_construction" | "under_maintenance" | "closed";
  block_wing: string;
  street_address: string;
  gps_latitude: string | null;
  gps_longitude: string | null;
  number_of_floors: number;
  number_of_basement_floors: number;
  total_units: number;
  residential_units: number;
  commercial_units: number;
  total_floor_area_sqm: string | null;
  rentable_area_sqm: string | null;
  building_height_meters: string | null;
  construction_year: number | null;
  completion_date: string | null;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number | null;
  number_of_elevators: number;
  parking_capacity: number | null;
  generator_available: boolean;
  water_supply: string;
  fire_protection_system: boolean;
  cctv_coverage: string;
  security_service: string;
  access_control: string;
  reception_available: boolean;
  emergency_exits: number | null;
  building_condition: "excellent" | "good" | "fair" | "poor" | "";
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  maintenance_schedule: "weekly" | "monthly" | "quarterly" | "annually" | "";
  warranty_expiry: string | null;
  main_electricity_meter: string;
  main_water_meter: string;
  internet_provider: string;
  hvac_system: string;
  building_manager: string;
  maintenance_supervisor: string;
  cleaning_contractor: string;
  building_permit_number: string;
  occupancy_certificate: string;
  insurance_policy_number: string;
  architectural_drawing_reference: string;
  documents: BuildingDocument[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_by_username: string | null;
  updated_by_username: string | null;
}

export interface BuildingDocument {
  id: number;
  building: number;
  name: string;
  file: string;
  created_at: string;
}

export interface Floor {
  id: number;
  floor_id_display: string;
  code: string;
  building: number;
  building_name: string;
  property_id: number;
  property_name: string;
  name: string;
  floor_number: number;
  floor_type: "residential" | "commercial" | "parking" | "office";
  status: "active" | "under_maintenance" | "closed";
  total_area_sqm: string | null;
  rentable_area_sqm: string | null;
  common_area_sqm: string | null;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  accessibility_features: string;
  emergency_exit_count: number | null;
  fire_safety_equipment: string;
  utility_meter_id: string;
  next_maintenance_date: string | null;
  cleaning_schedule: "daily" | "weekly" | "monthly" | "";
  floor_manager: string;
  security_zone: string;
  cctv_coverage: boolean;
  remarks: string;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_by_username: string | null;
  updated_by_username: string | null;
}

export interface Unit {
  id: number;
  unit_id_display: string;
  floor: number;
  building_id: number;
  building_name: string;
  property_id: number;
  property_name: string;
  unit_number: string;
  unit_name: string;
  unit_type: "apartment" | "office" | "shop" | "warehouse" | "villa" | "hotel_room" | "parking";
  unit_category: "residential" | "commercial" | "industrial" | "mixed_use" | "";
  usage_type: "residential" | "retail" | "office" | "storage" | "";
  ownership_type: "owned" | "leased" | "rented" | "";
  status: "draft" | "vacant" | "reserved" | "leased" | "expiring" | "under_maintenance" | "blocked";
  area_sqm: string | null;
  rentable_area_sqm: string | null;
  number_of_bedrooms: number | null;
  number_of_bathrooms: number | null;
  balcony: boolean;
  kitchen: boolean;
  parking_space: string;
  storage_room: string;
  furnished: boolean;
  accessibility_features: string;
  monthly_rent: string | null;
  security_deposit: string | null;
  service_charge: string | null;
  utility_billing_method: "metered" | "fixed_rate" | "included" | "";
  vat_applicable: boolean;
  currency: string;
  current_tenant_id: number | null;
  current_tenant_name: string | null;
  current_lease_id: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  electricity_meter_number: string;
  water_meter_number: string;
  gas_meter_number: string;
  internet_connection: boolean;
  utility_account_number: string;
  maintenance_status: "excellent" | "good" | "fair" | "poor" | "";
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  warranty_expiry: string | null;
  air_conditioning: boolean;
  heating: boolean;
  smart_lock: boolean;
  smoke_detector: boolean;
  cctv_coverage: boolean;
  internet_ready: boolean;
  documents: UnitDocument[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_by_username: string | null;
  updated_by_username: string | null;
}

export interface UnitDocument {
  id: number;
  unit: number;
  name: string;
  file: string;
  created_at: string;
}

export interface Tenant {
  id: number;
  tenant_id_display: string;
  tenant_code: string;
  tenant_type: "individual" | "company";
  status:
    | "prospect" | "application_submitted" | "kyc_verification" | "approved"
    | "lease_signed" | "active_tenant" | "lease_renewal" | "move_out" | "former_tenant";
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "";
  nationality: string;
  national_id_or_business_reg: string;
  tax_identification_number: string;
  company_name: string;
  business_registration_no: string;
  business_license_no: string;
  vat_registration_no: string;
  contact_person: string;
  phone_number: string;
  alternate_phone: string;
  email: string;
  preferred_contact_method: "sms" | "email" | "phone" | "";
  current_address: string;
  country: string;
  region: string;
  sub_city: string;
  woreda: string;
  postal_code: string;
  preferred_payment_method: "bank_transfer" | "mobile_money" | "cash" | "";
  bank_name: string;
  bank_account_number: string;
  current_property_name: string | null;
  current_building_name: string | null;
  current_floor_name: string | null;
  current_unit_number: string | null;
  current_lease_id: number | null;
  current_lease_number: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  current_monthly_rent: string | null;
  current_security_deposit: string | null;
  outstanding_balance: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  preferred_language: "english" | "amharic" | "";
  accessibility_requirements: string;
  kyc_verified: boolean;
  credit_check_status: "pending" | "passed" | "failed" | "";
  background_check_status: "pending" | "cleared" | "flagged" | "";
  blacklist_status: boolean;
  documents: TenantDocument[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_by_username: string | null;
  updated_by_username: string | null;
}

export interface TenantDocument {
  id: number;
  tenant: number;
  name: string;
  file: string;
  created_at: string;
}

export interface Lease {
  id: number;
  lease_id_display: string;
  unit: number;
  tenant: number;
  lease_number: string;
  lease_version: string;
  lease_type: "residential" | "commercial" | "office" | "warehouse" | "";
  status:
    | "draft" | "pending_approval" | "approved" | "awaiting_signature" | "active"
    | "renewal_pending" | "renewed" | "amended" | "suspended" | "terminated"
    | "expired" | "cancelled";
  property_id: number;
  property_name: string;
  building_id: number;
  building_name: string;
  floor_id: number;
  unit_number: string;
  tenant_name: string;
  tenant_contact_number: string;
  tenant_email: string;
  tenant_type: string;
  start_date: string;
  end_date: string;
  lease_duration_days: number | null;
  move_in_date: string | null;
  move_out_date: string | null;
  renewal_notice_period_days: number | null;
  monthly_rent: string;
  security_deposit: string;
  service_charge: string | null;
  utility_charges: string | null;
  parking_fee: string | null;
  currency: string;
  billing_frequency: "monthly" | "quarterly" | "annually";
  payment_due_day: number;
  rent_escalation_type: "fixed_percent" | "cpi_based" | "";
  rent_escalation_percent: string | null;
  total_monthly_charge: string;
  invoice_generation_day: number | null;
  payment_method: "bank_transfer" | "mobile_money" | "cash" | "";
  bank_account: string;
  late_payment_penalty_percent: string | null;
  grace_period_days: number | null;
  outstanding_balance: string;
  approval_status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  approved_by_username: string | null;
  approval_date: string | null;
  digital_signature_status: "not_signed" | "signed";
  renewal_option: boolean;
  renewal_period_months: number | null;
  early_termination_allowed: boolean;
  early_termination_notice_days: number | null;
  maintenance_responsibility: "tenant" | "landlord" | "";
  insurance_required: boolean;
  subletting_allowed: boolean;
  pet_policy: "allowed" | "not_allowed" | "case_by_case" | "";
  documents: LeaseDocument[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  created_by_username: string | null;
  updated_by_username: string | null;
}

export interface LeaseDocument {
  id: number;
  lease: number;
  name: string;
  file: string;
  created_at: string;
}

export interface Payment {
  id: number;
  invoice: number;
  amount: string;
  method: "bank_transfer" | "mobile_money" | "cash" | "card";
  paid_at: string;
  transaction_reference: string;
}

export interface Invoice {
  id: number;
  lease: number;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  base_rent: string;
  service_charge: string;
  other_charges: string;
  total_amount: string;
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
  amount_paid: string;
  outstanding_balance: string;
  payments: Payment[];
}

export interface CurrentUser {
  username: string;
  full_name: string;
  organization: { id: number; name: string };
  role: string;
}
