import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeases } from '../../context/LeaseContext';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LeaseDetailPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const { leases, deleteLease } = useLeases();
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'spatial' | 'policies'>('overview');

  // Find lease from context array
  const lease = leases.find((l) => l.id === leaseId || l.leaseNumber === leaseId);

  if (!lease) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Lease Agreement Not Found</h2>
        <p className="text-sm text-gray-500">The lease record you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/leases')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Back to Leases List
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this lease record?')) {
      deleteLease(lease.id);
      navigate('/leases');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title={`Lease Contract: ${lease.leaseNumber}`} 
          description={`Registered agreement for ${lease.tenantName} at ${lease.propertyName}`} 
        />
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/leases')}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            &larr; Back to Leases
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition shadow-sm cursor-pointer"
          >
            Delete Lease
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-semibold uppercase text-gray-500">Contract Status</div>
          <div className="text-lg font-bold text-indigo-600 mt-1">{lease.leaseStatus || 'Active'}</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-semibold uppercase text-gray-500">Monthly Rent</div>
          <div className="text-lg font-bold text-emerald-600 mt-1">ETB {Number(lease.monthlyRent || 0).toLocaleString()}</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-semibold uppercase text-gray-500">Lease Period</div>
          <div className="text-sm font-semibold text-gray-800 mt-1">{lease.leaseStartDate} to {lease.leaseEndDate}</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="text-xs font-semibold uppercase text-gray-500">Security Deposit</div>
          <div className="text-lg font-bold text-gray-900 mt-1">ETB {Number(lease.securityDeposit || 0).toLocaleString()}</div>
        </Card>
      </div>
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 gap-6 shadow-xs">
        {[
          { id: 'overview', label: 'Tenant & General Info' },
          { id: 'spatial', label: 'Property & Spatial Mapping' },
          { id: 'financial', label: 'Financial & Payment Schedule' },
          { id: 'policies', label: 'Compliance & Policies' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition cursor-pointer ${
              activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 shadow-xs">
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Lease ID</span>
              <span className="text-sm font-medium text-gray-800">{lease.id}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Lease Type</span>
              <span className="text-sm font-medium text-gray-800">{lease.leaseType}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Lease Version</span>
              <span className="text-sm font-medium text-gray-800">{lease.leaseVersion || 'V1.0'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Tenant ID</span>
              <span className="text-sm font-medium text-gray-800">{lease.tenantId}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Tenant Name</span>
              <span className="text-sm font-medium text-gray-800">{lease.tenantName}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Tenant Type</span>
              <span className="text-sm font-medium text-gray-800">{lease.tenantType || 'Individual'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Contact Number</span>
              <span className="text-sm font-medium text-gray-800">{lease.contactNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Email Address</span>
              <span className="text-sm font-medium text-gray-800">{lease.emailAddress || 'N/A'}</span>
            </div>
          </div>
        )}

        {activeTab === 'spatial' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Property ID</span>
              <span className="text-sm font-medium text-gray-800">{lease.propertyId}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Property Name</span>
              <span className="text-sm font-medium text-gray-800">{lease.propertyName}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Building</span>
              <span className="text-sm font-medium text-gray-800">{lease.buildingName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Unit Number</span>
              <span className="text-sm font-medium text-gray-800">{lease.unitNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Lease Duration</span>
              <span className="text-sm font-medium text-gray-800">{lease.leaseDuration || '12 Months'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Move-In Date</span>
              <span className="text-sm font-medium text-gray-800">{lease.moveInDate || lease.leaseStartDate}</span>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Monthly Rent</span>
              <span className="text-sm font-bold text-emerald-600">ETB {Number(lease.monthlyRent || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Security Deposit</span>
              <span className="text-sm font-medium text-gray-800">ETB {Number(lease.securityDeposit || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Service Charge</span>
              <span className="text-sm font-medium text-gray-800">ETB {Number(lease.serviceCharge || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Payment Frequency</span>
              <span className="text-sm font-medium text-gray-800">{lease.paymentFrequency || 'Monthly'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Payment Due Day</span>
              <span className="text-sm font-medium text-gray-800">Day {lease.paymentDueDay || 5} of each month</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Payment Method</span>
              <span className="text-sm font-medium text-gray-800">{lease.paymentMethod || 'Bank Transfer'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Outstanding Balance</span>
              <span className="text-sm font-bold text-rose-600">ETB {Number(lease.outstandingBalance || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Renewal Option</span>
              <span className="text-sm font-medium text-gray-800">{lease.renewalOption || 'Yes'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Early Termination</span>
              <span className="text-sm font-medium text-gray-800">{lease.earlyTerminationAllowed || 'Yes'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Subletting Allowed</span>
              <span className="text-sm font-medium text-gray-800">{lease.sublettingAllowed || 'No'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Maintenance Responsibility</span>
              <span className="text-sm font-medium text-gray-800">{lease.maintenanceResponsibility || 'Tenant'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Pet Policy</span>
              <span className="text-sm font-medium text-gray-800">{lease.petPolicy || 'Not Allowed'}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-400 block">Digital Signature</span>
              <span className="text-sm font-medium text-indigo-600">{lease.digitalSignatureStatus || 'Signed'}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}