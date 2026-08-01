import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Building, Property } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Breadcrumb } from "../../components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function BuildingsListPage() {
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get("property");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { items, isLoading, error } = useCollection<Building>(
    "/properties/buildings/",
    propertyFilter ? { property: propertyFilter } : undefined
  );
  const { items: properties } = useCollection<Property>("/properties/");

  const filtered = items.filter((b) => {
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Building" }]} />
      <PageHeader
        title="Buildings"
        description="Every building across your properties"
        action={
          <Button variant="accent" onClick={() => navigate("/buildings/new")}>
            <Plus className="h-4 w-4" /> New Building
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name or code..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_construction">Under Construction</SelectItem>
            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Building>
        isLoading={isLoading}
        rows={filtered}
        onRowClick={(row) => navigate(`/buildings/${row.id}`)}
        emptyMessage="No buildings yet. Create your first building to get started."
        columns={[
          { header: "ID", render: (b) => <span className="font-tabular text-muted-foreground">{b.building_id_display}</span> },
          { header: "Name", render: (b) => <span className="font-medium">{b.name}</span> },
          { header: "Property", render: (b) => properties.find((p) => p.id === b.property)?.name ?? b.property_name },
          { header: "Type", render: (b) => b.building_type?.replace("_", " ") || "—" },
          { header: "Floors", render: (b) => b.number_of_floors },
          { header: "Occupancy", render: (b) => b.occupancy_rate !== null ? `${b.occupancy_rate}%` : "—" },
          { header: "Status", render: (b) => <StatusBadge status={b.status} /> },
        ]}
      />
    </div>
  );
}
