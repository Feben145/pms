export type TenantType = 'Individual' | 'Company';

export type TenantStatus = 
  | 'Prospect' 
  | 'Application Submitted' 
  | 'KYC Verification' 
  | 'Approved' 
  | 'Lease Signed' 
  | 'Active Tenant' 
  | 'Lease Renewal' 
  | 'Move-Out' 
  | 'Former Tenant';

export interface Tenant {
  id: string;
  tenantId: string;
  tenantCode: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  tenantName: string

  // Personal Information
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  nationality?: string;
  nationalIdOrPassport?: string;
  taxIdentificationNumber?: string;

  // Company Information
  companyName?: string;
  businessRegistrationNo?: string;
  businessLicenseNo?: string;
  vatRegistrationNo?: string;
  contactPerson?: string;

  // Contact Information
  mobileNumber: string;
  alternatePhone?: string;
  emailAddress: string;
  preferredContactMethod: 'SMS' | 'Email' | 'Phone';

  // Address Information
  currentAddress: string;
  country: string;
  region: string;
  subCity: string;
  woreda: string;
  postalCode?: string;

  // Lease Information & Relational Sync Keys
  propertyId: string;
  buildingId: string;
  floorId: string;
  unitId: string;
  leaseId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  moveInDate: string;
  moveOutDate?: string;

  // Financial Information
  monthlyRent: number;
  securityDeposit: number;
  paymentMethod: 'Bank Transfer' | 'Mobile Money' | 'Cash';
  bankName?: string;
  bankAccountNumber?: string;
  outstandingBalance: number;

  // Emergency Contact
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhone: string;

  // Supporting Documents
  idCopy?: string;
  passportCopy?: string;
  leaseAgreementDoc?: string;
  businessLicenseDoc?: string;
  proofOfAddressDoc?: string;

  // Preferences & Compliance
  preferredLanguage: string;
  accessibilityRequirements?: string;
  kycVerificationStatus: 'Pending' | 'Verified';
  creditCheckStatus: 'Passed' | 'Failed' | 'Pending';
  backgroundCheckStatus: 'Cleared' | 'Flagged' | 'Pending';
  blacklistStatus: 'Yes' | 'No';

  // Audit Fields
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

export function getTenantStats(unitId: string, tenants: Tenant[]) {
  const unitTenants = tenants.filter(t => t.unitId === unitId && t.tenantStatus === 'Active Tenant');
  const totalActiveTenants = unitTenants.length;
  const totalRentCommitted = unitTenants.reduce((acc, t) => acc + t.monthlyRent, 0);
  const totalOutstandingBalance = unitTenants.reduce((acc, t) => acc + t.outstandingBalance, 0);

  return {
    totalActiveTenants,
    totalRentCommitted,
    totalOutstandingBalance,
  };
}