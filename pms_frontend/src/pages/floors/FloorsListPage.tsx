import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Floor, Building } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Breadcrumb } from "../../components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function FloorsListPage() {
  const [searchParams] = useSearchParams();
  const buildingFilter = searchParams.get("building");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { items, isLoading, error } = useCollection<Floor>(
    "/properties/floors/",
    buildingFilter ? { building: buildingFilter } : undefined
  );
  const { items: buildings } = useCollection<Building>("/properties/buildings/");

  const filtered = items.filter((f) => {
    const matchesSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Floor" }]} />
      <PageHeader
        title="Floors"
        description="Every floor across your buildings"
        action={
          <Button variant="accent" onClick={() => navigate("/floors/new")}>
            <Plus className="h-4 w-4" /> New Floor
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search by name or code..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Floor>
        isLoading={isLoading}
        rows={filtered}
        onRowClick={(row) => navigate(`/floors/${row.id}`)}
        emptyMessage="No floors yet. Create your first floor to get started."
        columns={[
          { header: "ID", render: (f) => <span className="font-tabular text-muted-foreground">{f.floor_id_display}</span> },
          { header: "Name", render: (f) => <span className="font-medium">{f.name}</span> },
          { header: "Building", render: (f) => buildings.find((b) => b.id === f.building)?.name ?? f.building_name },
          { header: "Type", render: (f) => f.floor_type },
          { header: "Units", render: (f) => `${f.occupied_units}/${f.total_units} occupied` },
          { header: "Status", render: (f) => <StatusBadge status={f.status} /> },
        ]}
      />
    </div>
  );
}
