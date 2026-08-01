import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { apiClient } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";
import type { Building, Floor } from "../../types/models";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function BuildingDetailPage() {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { items: floors, isLoading: floorsLoading } = useCollection<Floor>("/properties/floors/", { building: buildingId! });

  useEffect(() => {
    apiClient.get<Building>(`/properties/buildings/${buildingId}/`).then(({ data }) => {
      setBuilding(data);
      setIsLoading(false);
    });
  }, [buildingId]);

  if (isLoading || !building) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Building", to: "/buildings" }, { label: building.name }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{building.name}</h1>
            <StatusBadge status={building.status} />
          </div>
          <p className="text-sm text-muted-foreground font-tabular">
            {building.building_id_display} · {building.code} · {building.property_name}
          </p>
        </div>
        <Button variant="accent" onClick={() => navigate(`/buildings/${buildingId}/edit`)}>Edit Building</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Units" value={String(building.total_units)} />
        <StatCard label="Occupied" value={String(building.occupied_units)} />
        <StatCard label="Vacant" value={String(building.vacant_units)} />
        <StatCard label="Occupancy Rate" value={building.occupancy_rate !== null ? `${building.occupancy_rate}%` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Structure</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Building Type" value={building.building_type?.replace("_", " ") || "—"} />
              <InfoRow label="Block / Wing" value={building.block_wing || "—"} />
              <InfoRow label="Floors" value={String(building.number_of_floors)} />
              <InfoRow label="Basement Floors" value={String(building.number_of_basement_floors)} />
              <InfoRow label="Total Floor Area" value={building.total_floor_area_sqm ? `${Number(building.total_floor_area_sqm).toLocaleString()} sqm` : "—"} />
              <InfoRow label="Rentable Area" value={building.rentable_area_sqm ? `${Number(building.rentable_area_sqm).toLocaleString()} sqm` : "—"} />
              <InfoRow label="Construction Year" value={building.construction_year ? String(building.construction_year) : "—"} />
              <InfoRow label="Street Address" value={building.street_address || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Facilities</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Elevators" value={String(building.number_of_elevators)} />
              <InfoRow label="Parking Spaces" value={building.parking_capacity ? String(building.parking_capacity) : "—"} />
              <InfoRow label="Security Service" value={building.security_service || "—"} />
              <InfoRow label="Access Control" value={building.access_control || "—"} />
              <InfoRow label="Generator" value={building.generator_available ? "Available" : "Not available"} />
              <InfoRow label="Fire Protection" value={building.fire_protection_system ? "Installed" : "Not installed"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Floors</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/floors/new?building=${buildingId}`)}>
                <Plus className="h-3.5 w-3.5" /> New Floor
              </Button>
            </CardHeader>
            <CardContent>
              {floorsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : floors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No floors yet for this building.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {floors.map((f) => (
                      <TableRow key={f.id} className="cursor-pointer" onClick={() => navigate(`/floors/${f.id}`)}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell className="text-muted-foreground">{f.floor_type}</TableCell>
                        <TableCell className="font-tabular">{f.occupied_units}/{f.total_units} occupied</TableCell>
                        <TableCell><StatusBadge status={f.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              {building.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {building.documents.map((doc) => (
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
            <h3 className="text-sm font-medium text-foreground mb-3">Maintenance</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Condition</dt><dd className="capitalize">{building.building_condition || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last Inspection</dt><dd className="font-tabular">{building.last_inspection_date || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Next Inspection</dt><dd className="font-tabular">{building.next_inspection_date || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Schedule</dt><dd className="capitalize">{building.maintenance_schedule || "—"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Management</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Building Manager</dt><dd>{building.building_manager || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Maintenance Supervisor</dt><dd>{building.maintenance_supervisor || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Cleaning Contractor</dt><dd>{building.cleaning_contractor || "—"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{building.created_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{new Date(building.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{building.updated_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{new Date(building.updated_at).toLocaleDateString()}</dd></div>
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
