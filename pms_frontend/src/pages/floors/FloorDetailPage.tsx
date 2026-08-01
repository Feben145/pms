import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { apiClient } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";
import type { Floor, Unit } from "../../types/models";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function FloorDetailPage() {
  const { floorId } = useParams();
  const navigate = useNavigate();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { items: units, isLoading: unitsLoading } = useCollection<Unit>("/properties/units/", { floor: floorId! });

  useEffect(() => {
    apiClient.get<Floor>(`/properties/floors/${floorId}/`).then(({ data }) => {
      setFloor(data);
      setIsLoading(false);
    });
  }, [floorId]);

  if (isLoading || !floor) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Floor", to: "/floors" }, { label: floor.name }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{floor.name}</h1>
            <StatusBadge status={floor.status} />
          </div>
          <p className="text-sm text-muted-foreground font-tabular">
            {floor.floor_id_display} · {floor.building_name} · {floor.property_name}
          </p>
        </div>
        <Button variant="accent" onClick={() => navigate(`/floors/${floorId}/edit`)}>Edit Floor</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Units" value={String(floor.total_units)} />
        <StatCard label="Occupied" value={String(floor.occupied_units)} />
        <StatCard label="Vacant" value={String(floor.vacant_units)} />
        <StatCard label="Floor Number" value={String(floor.floor_number)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Structure</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Floor Type" value={floor.floor_type} />
              <InfoRow label="Total Area" value={floor.total_area_sqm ? `${Number(floor.total_area_sqm).toLocaleString()} sqm` : "—"} />
              <InfoRow label="Rentable Area" value={floor.rentable_area_sqm ? `${Number(floor.rentable_area_sqm).toLocaleString()} sqm` : "—"} />
              <InfoRow label="Common Area" value={floor.common_area_sqm ? `${Number(floor.common_area_sqm).toLocaleString()} sqm` : "—"} />
              <InfoRow label="Floor Manager" value={floor.floor_manager || "—"} />
              <InfoRow label="Security Zone" value={floor.security_zone || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Safety</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Accessibility" value={floor.accessibility_features || "—"} />
              <InfoRow label="Emergency Exits" value={floor.emergency_exit_count != null ? String(floor.emergency_exit_count) : "—"} />
              <InfoRow label="Fire Safety Equipment" value={floor.fire_safety_equipment || "—"} />
              <InfoRow label="CCTV Coverage" value={floor.cctv_coverage ? "Covered" : "Not covered"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Units</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/units/new?floor=${floorId}`)}>
                <Plus className="h-3.5 w-3.5" /> New Unit
              </Button>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : units.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No units yet on this floor.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Unit #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((u) => (
                      <TableRow key={u.id} className="cursor-pointer" onClick={() => navigate(`/units/${u.id}`)}>
                        <TableCell className="font-medium font-tabular">{u.unit_number}</TableCell>
                        <TableCell className="text-muted-foreground">{u.unit_type}</TableCell>
                        <TableCell>{u.current_tenant_name ?? "—"}</TableCell>
                        <TableCell className="text-right font-tabular">{u.monthly_rent ? `ETB ${Number(u.monthly_rent).toLocaleString()}` : "—"}</TableCell>
                        <TableCell><StatusBadge status={u.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Utilities & Maintenance</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Utility Meter ID</dt><dd className="font-tabular">{floor.utility_meter_id || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Next Maintenance</dt><dd className="font-tabular">{floor.next_maintenance_date || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Cleaning Schedule</dt><dd className="capitalize">{floor.cleaning_schedule || "—"}</dd></div>
            </dl>
          </Card>

          {floor.remarks && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Remarks</h3>
              <p className="text-xs text-muted-foreground">{floor.remarks}</p>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{floor.created_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{new Date(floor.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{floor.updated_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{new Date(floor.updated_at).toLocaleDateString()}</dd></div>
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
