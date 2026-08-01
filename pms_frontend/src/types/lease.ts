export type LeaseType = 'Residential' | 'Commercial' | 'Office' | 'Warehouse';

export type LeaseStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Awaiting Signature' 
  | 'Active' 
  | 'Renewal Pending' 
  | 'Renewed' 
  | 'Amended' 
  | 'Suspended' 
  | 'Terminated' 
  | 'Expired' 
  | 'Cancelled';

export interface Lease {
  id: string;
  leaseNumber: string;
  leaseVersion: string;
  leaseType: string;
  leaseStatus: string;
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  unitId: string;
  unitNumber: string;
  tenantId: string;
  tenantName: string;
  tenantType: string;
  contactNumber: string;
  emailAddress: string;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseDuration: string;
  moveInDate: string;
  moveOutDate?: string;       // <-- Make optional with ?
  renewalNoticePeriod?: string; // <-- Make optional with ?
  monthlyRent: number;
  securityDeposit: number;
  serviceCharge?: number;     // <-- Make optional with ?
  utilityCharges: string;
  parkingFee?: number;        // <-- Make optional with ?
  currency: string;
  paymentFrequency: string;
  paymentDueDay: number;
  rentEscalationType: string;
  rentEscalationValue: string;
  invoiceGenerationDate: string;
  paymentMethod: string;
  bankAccount: string;
  outstandingBalance: number;
  latePaymentPenalty: string;
  gracePeriod: string;
  leaseCreatedBy: string;
  approvalStatus: string;
  approvedBy: string;
  approvalDate: string;
  digitalSignatureStatus: string;
  renewalOption: string;
  renewalPeriod: string;
  earlyTerminationAllowed: string;
  noticePeriod: string;
  maintenanceResponsibility: string;
  insuranceRequired: string;
  sublettingAllowed: string;
  petPolicy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}