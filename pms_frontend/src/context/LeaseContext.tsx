import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface Lease {
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
  moveOutDate: string;
  renewalNoticePeriod: string;
  monthlyRent: number;
  securityDeposit: number;
  serviceCharge: number;
  utilityCharges: string;
  parkingFee: number;
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

interface LeaseContextType {
  leases: Lease[];
  addLease: (lease: Lease) => void;
  getLeaseById: (id: string) => Lease | undefined;
  deleteLease: (id: string) => void; // <-- Added deleteLease type
}

const LeaseContext = createContext<LeaseContextType | undefined>(undefined);

const INITIAL_LEASES: Lease[] = [
  {
    id: 'LEA-0001',
    leaseNumber: 'LSE-2026-001',
    leaseVersion: 'V1.0',
    leaseType: 'Residential',
    leaseStatus: 'Active',
    propertyId: 'PROP-001',
    propertyName: 'Sunrise Business Park',
    buildingId: 'BLD-001',
    buildingName: 'Tower A',
    floorId: 'FLR-01',
    unitId: 'UNT-101',
    unitNumber: 'A-101',
    tenantId: 'TEN-1001',
    tenantName: 'Abebe Bekele',
    tenantType: 'Individual',
    contactNumber: '+251911234567',
    emailAddress: 'abebe@example.com',
    leaseStartDate: '2026-01-01',
    leaseEndDate: '2026-12-31',
    leaseDuration: '12 Months',
    moveInDate: '2026-01-05',
    moveOutDate: '2026-12-31',
    renewalNoticePeriod: '60 Days',
    monthlyRent: 25000,
    securityDeposit: 50000,
    serviceCharge: 2000,
    utilityCharges: 'Metered',
    parkingFee: 1000,
    currency: 'ETB',
    paymentFrequency: 'Monthly',
    paymentDueDay: 5,
    rentEscalationType: 'Fixed %',
    rentEscalationValue: '5% Annually',
    invoiceGenerationDate: '01 of each month',
    paymentMethod: 'Bank Transfer',
    bankAccount: 'CBE-1002345',
    outstandingBalance: 0,
    latePaymentPenalty: '2% per month',
    gracePeriod: '5 Days',
    leaseCreatedBy: 'Leasing Officer',
    approvalStatus: 'Approved',
    approvedBy: 'Property Manager',
    approvalDate: '2025-12-28',
    digitalSignatureStatus: 'Signed',
    renewalOption: 'Yes',
    renewalPeriod: '12 Months',
    earlyTerminationAllowed: 'Yes',
    noticePeriod: '60 Days',
    maintenanceResponsibility: 'Tenant',
    insuranceRequired: 'Yes',
    sublettingAllowed: 'No',
    petPolicy: 'Not Allowed',
    createdDate: '2026-07-15',
    lastUpdatedBy: 'Property Manager',
    lastUpdatedDate: '2026-07-20'
  }
];

export const LeaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leases, setLeases] = useState<Lease[]>(() => {
    const saved = localStorage.getItem('pms_leases');
    return saved ? JSON.parse(saved) : INITIAL_LEASES;
  });

  const addLease = (newLease: Lease) => {
    setLeases(prev => {
      const updated = [newLease, ...prev];
      localStorage.setItem('pms_leases', JSON.stringify(updated));
      return updated;
    });
  };

  const getLeaseById = (id: string) => {
    return leases.find(l => l.id === id || l.leaseNumber === id);
  };

  const deleteLease = (id: string) => {
    setLeases(prev => {
      const updated = prev.filter(l => l.id !== id && l.leaseNumber !== id);
      localStorage.setItem('pms_leases', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <LeaseContext.Provider value={{ leases, addLease, getLeaseById, deleteLease }}>
      {children}
    </LeaseContext.Provider>
  );
};

export const useLeases = () => {
  const context = useContext(LeaseContext);
  if (!context) {
    throw new Error('useLeases must be used within a LeaseProvider');
  }
  return context;
};