import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Unit } from "../../types/models";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UnitDetailPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Unit>(`/properties/units/${unitId}/`).then(({ data }) => {
      setUnit(data);
      setIsLoading(false);
    });
  }, [unitId]);

  if (isLoading || !unit) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  const isVacant = unit.status === "vacant";

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Unit", to: "/units" }, { label: unit.unit_number }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {unit.unit_name || `Unit ${unit.unit_number}`}
            </h1>
            <StatusBadge status={unit.status} />
          </div>
          <p className="text-sm text-muted-foreground font-tabular">
            {unit.unit_id_display} · {unit.building_name} · {unit.property_name}
          </p>
        </div>
        <div className="flex gap-2">
          {isVacant && (
            <Button variant="outline" onClick={() => navigate(`/leases/new?unit=${unitId}`)}>Create Lease</Button>
          )}
          <Button variant="accent" onClick={() => navigate(`/units/${unitId}/edit`)}>Edit Unit</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Rent" value={unit.monthly_rent ? `${unit.currency} ${Number(unit.monthly_rent).toLocaleString()}` : "—"} />
        <StatCard label="Area" value={unit.area_sqm ? `${Number(unit.area_sqm).toLocaleString()} sqm` : "—"} />
        <StatCard label="Bedrooms / Bathrooms" value={`${unit.number_of_bedrooms ?? "—"} / ${unit.number_of_bathrooms ?? "—"}`} />
        <StatCard label="Current Tenant" value={unit.current_tenant_name ?? "Vacant"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {unit.current_lease_id && (
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Lease</CardTitle>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate(`/leases/${unit.current_lease_id}`)}>
                  View lease →
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <InfoRow label="Tenant" value={unit.current_tenant_name ?? "—"} />
                <InfoRow label="Lease Start" value={unit.lease_start_date ?? "—"} />
                <InfoRow label="Lease End" value={unit.lease_end_date ?? "—"} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Unit Type" value={unit.unit_type} />
              <InfoRow label="Category" value={unit.unit_category || "—"} />
              <InfoRow label="Usage Type" value={unit.usage_type || "—"} />
              <InfoRow label="Ownership Type" value={unit.ownership_type || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Physical Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Rentable Area" value={unit.rentable_area_sqm ? `${Number(unit.rentable_area_sqm).toLocaleString()} sqm` : "—"} />
              <InfoRow label="Parking Space" value={unit.parking_space || "—"} />
              <InfoRow label="Storage Room" value={unit.storage_room || "—"} />
              <InfoRow label="Furnished" value={unit.furnished ? "Yes" : "No"} />
              <InfoRow label="Balcony" value={unit.balcony ? "Yes" : "No"} />
              <InfoRow label="Kitchen" value={unit.kitchen ? "Yes" : "No"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Features & Amenities</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {[
                ["Air Conditioning", unit.air_conditioning], ["Heating", unit.heating],
                ["Smart Lock", unit.smart_lock], ["Smoke Detector", unit.smoke_detector],
                ["CCTV Coverage", unit.cctv_coverage], ["Internet Ready", unit.internet_ready],
              ].filter(([, v]) => v).map(([label]) => (
                <span key={label as string} className="text-xs bg-muted px-2.5 py-1 rounded-full text-foreground">{label}</span>
              ))}
              {![unit.air_conditioning, unit.heating, unit.smart_lock, unit.smoke_detector, unit.cctv_coverage, unit.internet_ready].some(Boolean) && (
                <p className="text-sm text-muted-foreground">No features recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              {unit.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {unit.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {doc.name}</span>
                      <a href={doc.file} target="_blank" rel="noreferrer" className="text-accent hover:underline text-xs">View</a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Financial</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Security Deposit</dt><dd className="font-tabular">{unit.security_deposit ? `${unit.currency} ${Number(unit.security_deposit).toLocaleString()}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Service Charge</dt><dd className="font-tabular">{unit.service_charge ? `${unit.currency} ${Number(unit.service_charge).toLocaleString()}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Utility Billing</dt><dd className="capitalize">{unit.utility_billing_method?.replace("_", " ") || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">VAT Applicable</dt><dd>{unit.vat_applicable ? "Yes" : "No"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Utilities</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Electricity Meter</dt><dd className="font-tabular">{unit.electricity_meter_number || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Water Meter</dt><dd className="font-tabular">{unit.water_meter_number || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Internet</dt><dd>{unit.internet_connection ? "Connected" : "Not connected"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Maintenance</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{unit.maintenance_status || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last Inspection</dt><dd className="font-tabular">{unit.last_inspection_date || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Next Inspection</dt><dd className="font-tabular">{unit.next_inspection_date || "—"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{unit.created_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{new Date(unit.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{unit.updated_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{new Date(unit.updated_at).toLocaleDateString()}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
