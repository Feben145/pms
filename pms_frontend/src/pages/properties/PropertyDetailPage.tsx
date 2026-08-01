/**
 * Read-focused view of a property: profile summary, computed occupancy
 * stats (rolled up from the real Building/Floor/Unit hierarchy), its
 * Buildings (linking out to their own detail pages), documents, and
 * audit trail. Editing happens on a separate page
 * (PropertyRegistrationPage in edit mode).
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { apiClient } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";
import type { Property, Building } from "../../types/models";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function PropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { items: buildings, isLoading: buildingsLoading } = useCollection<Building>("/properties/buildings/", {
    property: propertyId!,
  });

  useEffect(() => {
    apiClient.get<Property>(`/properties/${propertyId}/`).then(({ data }) => {
      setProperty(data);
      setIsLoading(false);
    });
  }, [propertyId]);

  if (isLoading || !property) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Property List", to: "/properties" }, { label: property.name }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{property.name}</h1>
            <StatusBadge status={property.status} />
          </div>
          <p className="text-sm text-muted-foreground font-tabular">{property.property_id_display} · {property.code}</p>
        </div>
        <Button variant="accent" onClick={() => navigate(`/properties/${propertyId}/edit`)}>Edit Property</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Buildings" value={String(buildings.length)} />
        <StatCard label="Total Units" value={String(property.total_units_actual)} />
        <StatCard
          label="Occupancy Rate"
          value={property.occupancy_rate !== null ? `${property.occupancy_rate}%` : "—"}
        />
        <StatCard label="Monthly Revenue" value={property.monthly_rental_income ? `ETB ${Number(property.monthly_rental_income).toLocaleString()}` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {property.image && (
            <Card className="overflow-hidden">
              <img src={property.image} alt={property.name} className="w-full h-56 object-cover" />
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Type" value={property.property_type.replace("_", " ")} />
              <InfoRow label="Category" value={property.property_category || "—"} />
              <InfoRow label="Owner" value={property.owner_name || "—"} />
              <InfoRow label="Managing Company" value={property.managing_company || "—"} />
              <InfoRow label="Location" value={[property.city, property.sub_city, property.country].filter(Boolean).join(", ") || "—"} />
              <InfoRow label="Address" value={property.address || "—"} />
            </CardContent>
          </Card>

          {property.description && (
            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-foreground">{property.description}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Buildings</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/buildings/new?property=${propertyId}`)}>
                <Plus className="h-3.5 w-3.5" /> New Building
              </Button>
            </CardHeader>
            <CardContent>
              {buildingsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : buildings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No buildings yet for this property.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Floors</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildings.map((b) => (
                      <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/buildings/${b.id}`)}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-muted-foreground">{b.building_type?.replace("_", " ") || "—"}</TableCell>
                        <TableCell className="font-tabular">{b.number_of_floors}</TableCell>
                        <TableCell className="font-tabular">{b.occupancy_rate !== null ? `${b.occupancy_rate}%` : "—"}</TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
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
              {property.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {property.documents.map((doc) => (
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
              <div className="flex justify-between"><dt className="text-muted-foreground">Property Value</dt><dd className="font-tabular">{property.property_value ? `ETB ${Number(property.property_value).toLocaleString()}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Annual Operating Cost</dt><dd className="font-tabular">{property.annual_operating_cost ? `ETB ${Number(property.annual_operating_cost).toLocaleString()}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">VAT Applicable</dt><dd>{property.vat_applicable ? "Yes" : "No"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{property.created_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{new Date(property.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{property.updated_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{new Date(property.updated_at).toLocaleDateString()}</dd></div>
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
