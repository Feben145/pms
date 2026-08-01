import React,  { createContext, useContext, useState, } from 'react';
import type { Tenant } from '../types/tenant';
import type { ReactNode } from 'react';

interface TenantContextType {
  tenants: Tenant[];
  addTenant: (tenant: Tenant) => void;
  getTenantById: (id: string) => Tenant | undefined;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Initial real-world starting data if storage is empty
const INITIAL_TENANTS: Tenant[] = [
  {
      id: 'TEN-0001',
      tenantId: 'TNT-ID-0001',
      tenantCode: 'TNT-1001',
      tenantType: 'Individual',
      tenantStatus: 'Active Tenant',
      fullName: 'Abebe Bekele Kebede',
      mobileNumber: '+251911234567',
      emailAddress: 'abebe.bekele@example.com',
      preferredContactMethod: 'Email',
      currentAddress: 'Bole Road, Near Friendship',
      country: 'Ethiopia',
      region: 'Addis Ababa',
      subCity: 'Bole',
      woreda: 'Woreda 03',
      propertyId: 'PROP-001',
      buildingId: 'BLD-001',
      floorId: 'FLR-01',
      unitId: 'UNT-101',
      leaseId: 'LEASE-2026-001',
      leaseStartDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      moveInDate: '2026-01-05',
      monthlyRent: 25000,
      securityDeposit: 50000,
      paymentMethod: 'Bank Transfer',
      bankName: 'Commercial Bank of Ethiopia',
      outstandingBalance: 0,
      emergencyContactName: 'Sara Bekele',
      emergencyRelationship: 'Spouse',
      emergencyPhone: '+251911998877',
      preferredLanguage: 'English',
      kycVerificationStatus: 'Verified',
      creditCheckStatus: 'Passed',
      backgroundCheckStatus: 'Cleared',
      blacklistStatus: 'No',
      createdBy: 'Leasing Officer',
      createdDate: '2026-01-01',
      lastUpdatedBy: 'Property Manager',
      lastUpdatedDate: '2026-01-02',
      tenantName: ''
  }
];

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('pms_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const addTenant = (newTenant: Tenant) => {
    setTenants(prev => {
      const updated = [newTenant, ...prev];
      localStorage.setItem('pms_tenants', JSON.stringify(updated));
      return updated;
    });
  };

  const getTenantById = (id: string) => {
    return tenants.find(t => t.id === id || t.tenantId === id);
  };

  return (
    <TenantContext.Provider value={{ tenants, addTenant, getTenantById }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenants = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenants must be used within a TenantProvider');
  }
  return context;
};