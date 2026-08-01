import React, { createContext, useContext, useState } from 'react';
import type { Unit, Floor, Building, Property } from '../types/propertyHierarchy';

interface PropertyContextType {
  properties: Property[];
  buildings: Building[];
  floors: Floor[];
  units: Unit[];
  addFloor: (floor: Floor) => void;
  updateFloor: (floor: Floor) => void;
  addUnit: (unit: Unit) => void;
  updateUnit: (unit: Unit) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [properties, _setProperties] = useState<Property[]>([
    { id: 'PROP-001', name: 'Sunshine Residence', code: 'SR-01', type: 'Residential', address: '123 Main St', city: 'Addis Ababa', status: 'Active' }
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [buildings, _setBuildings] = useState<Building[]>([
    { id: 'BLD-001', name: 'Tower A', propertyId: 'PROP-001', totalFloors: 10 }
  ]);

  const [floors, setFloors] = useState<Floor[]>([
    {
      id: 'FLR-001',
      floorCode: 'F01',
      name: 'Ground Floor',
      buildingId: 'BLD-001',
      propertyId: 'PROP-001',
      floorNumber: '1',
      floorType: 'Commercial',
      totalAreaSqm: 1250,
      rentableAreaSqm: 1000,
      commonAreaSqm: 250,
      floorStatus: 'Active',
      emergencyExitCount: 2,
      cctvCoverage: 'Yes',
      floorManager: 'John Smith',
      createdDate: '15-Jul-26'
    }
  ]);

  const [units, setUnits] = useState<Unit[]>([
    {
      id: 'UNT-0001',
      unitCode: 'A-101',
      unitNumber: '101',
      unitName: 'Apartment 101',
      propertyId: 'PROP-001',
      buildingId: 'BLD-001',
      floorId: 'FLR-001',
      unitType: 'Apartment',
      unitCategory: 'Residential',
      usageType: 'Residential',
      ownershipType: 'Leased',
      unitStatus: 'Occupied',
      floorNumber: '1',
      areaSqm: 120,
      rentableAreaSqm: 115,
      bedrooms: 3,
      bathrooms: 2,
      balcony: 'Yes',
      kitchen: 'Yes',
      furnished: 'Yes',
      monthlyRent: 25000,
      securityDeposit: 50000,
      serviceCharge: 2000,
      utilityBillingMethod: 'Metered',
      taxApplicable: 'VAT Applicable',
      currency: 'ETB',
      occupancyStatus: 'Occupied',
      tenantId: 'TEN-1001',
      tenantName: 'ABC Trading PLC',
      leaseId: 'LEA-2026-001',
      leaseStartDate: '1-Jan-26',
      leaseEndDate: '31-Dec-26',
      airConditioning: 'Yes',
      heating: 'No',
      smartLock: 'Yes',
      smokeDetector: 'Yes',
      cctvCoverage: 'Yes',
      internetReady: 'Yes',
      createdDate: '15-Jul-26'
    }
  ]);

  const addFloor = (newFloor: Floor) => setFloors(prev => [...prev, newFloor]);
  const updateFloor = (updated: Floor) => setFloors(prev => prev.map(f => f.id === updated.id ? updated : f));

  const addUnit = (newUnit: Unit) => setUnits(prev => [...prev, newUnit]);
  const updateUnit = (updated: Unit) => setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));

  return (
    <PropertyContext.Provider value={{ properties, buildings, floors, units, addFloor, updateFloor, addUnit, updateUnit }}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) throw new Error('useProperties must be used within a PropertyProvider');
  return context;
};