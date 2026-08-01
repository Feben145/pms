//pms_frontend/src/types/propertyHierarchy.ts
export interface Property {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  status: string;
}

export interface Building {
  id: string;
  name: string;
  propertyId: string;
  totalFloors: number;
  utilities?: {
    waterConnection?: string;
    electricityConnection?: string;
    backupGenerator?: string;
    fireProtectionSystem?: string;
    cctvMonitoring?: string;
  };
}

export interface Floor {
  id: string;
  floorCode: string;
  name: string;
  buildingId: string;
  propertyId: string;
  floorNumber: string;
  floorType: 'Residential' | 'Commercial' | 'Parking' | 'Office';
  totalAreaSqm: number;
  rentableAreaSqm: number;
  commonAreaSqm: number;
  floorStatus: 'Active' | 'Under Maintenance' | 'Closed';
  accessibilityFeatures?: string;
  emergencyExitCount: number;
  fireSafetyEquipment?: string;
  utilityMeterId?: string;
  maintenanceSchedule?: string;
  floorManager?: string;
  securityZone?: string;
  cctvCoverage: 'Yes' | 'No';
  cleaningSchedule?: string;
  remarks?: string;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export interface Unit {
  id: string;
  unitCode: string;
  unitNumber: string;
  unitName: string;
  propertyId: string;
  buildingId: string;
  floorId: string;
  // Classification
  unitType: 'Apartment' | 'Office' | 'Shop' | 'Villa' | 'Warehouse' | 'Parking' | 'Hotel Room';
  unitCategory: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed-use';
  usageType: string;
  ownershipType: string;
  unitStatus: 'Draft' | 'Reserved' | 'Leased' | 'Occupied' | 'Expiring' | 'Vacant' | 'Cleaning' | 'Blocked';
  // Physical Details
  floorNumber: string;
  areaSqm: number;
  rentableAreaSqm: number;
  bedrooms?: number;
  bathrooms?: number;
  balcony: 'Yes' | 'No';
  kitchen: 'Yes' | 'No';
  parkingSpace?: string;
  storageRoom?: string;
  furnished: 'Yes' | 'No';
  accessibilityFeatures?: string;
  // Financial
  monthlyRent: number;
  securityDeposit: number;
  serviceCharge: number;
  utilityBillingMethod: string;
  taxApplicable: string;
  currency: string;
  // Occupancy
  occupancyStatus: string;
  tenantId?: string;
  tenantName?: string;
  leaseId?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  moveInDate?: string;
  moveOutDate?: string;
  // Utilities
  electricityMeterNumber?: string;
  waterMeterNumber?: string;
  gasMeterNumber?: string;
  internetConnection?: string;
  utilityAccountNumber?: string;
  // Maintenance & Safety
  maintenanceStatus?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  warrantyExpiry?: string;
  airConditioning: 'Yes' | 'No';
  heating: 'Yes' | 'No';
  smartLock: 'Yes' | 'No';
  smokeDetector: 'Yes' | 'No';
  cctvCoverage: 'Yes' | 'No';
  internetReady: 'Yes' | 'No';
  // Documents & Audit
  floorPlanDoc?: string;
  occupancyCertificate?: string;
  inspectionReport?: string;
  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

export function getFloorStats(floorId: string, units: Unit[]) {
  const floorUnits = units.filter(u => u.floorId === floorId);
  const totalUnits = floorUnits.length;
  const totalSizeSqFt = floorUnits.reduce((acc, u) => acc + (u.areaSqm * 10.764), 0); // Convert sqm to sqft for cards if needed
  const totalRentAmount = floorUnits.reduce((acc, u) => acc + u.monthlyRent, 0);
  const occupiedUnits = floorUnits.filter(u => u.unitStatus === 'Occupied' || u.unitStatus === 'Leased').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return {
    totalUnits,
    totalSizeSqFt,
    totalRentAmount,
    occupancyRate,
  };
}