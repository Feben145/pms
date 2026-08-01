import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Unit, Floor } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Breadcrumb } from "../../components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function UnitsListPage() {
  const [searchParams] = useSearchParams();
  const floorFilter = searchParams.get("floor");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { items, isLoading, error } = useCollection<Unit>(
    "/properties/units/",
    floorFilter ? { floor: floorFilter } : undefined
  );
  const { items: floors } = useCollection<Floor>("/properties/floors/");

  const filtered = items.filter((u) => {
    const matchesSearch = !search || u.unit_number.toLowerCase().includes(search.toLowerCase()) || u.unit_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Unit" }]} />
      <PageHeader
        title="Units"
        description="Every rentable unit across your properties"
        action={
          <Button variant="accent" onClick={() => navigate("/units/new")}>
            <Plus className="h-4 w-4" /> New Unit
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search by unit number or name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="leased">Leased / Occupied</SelectItem>
            <SelectItem value="expiring">Expiring</SelectItem>
            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Unit>
        isLoading={isLoading}
        rows={filtered}
        onRowClick={(row) => navigate(`/units/${row.id}`)}
        emptyMessage="No units yet. Create your first unit to get started."
        columns={[
          { header: "ID", render: (u) => <span className="font-tabular text-muted-foreground">{u.unit_id_display}</span> },
          { header: "Unit #", render: (u) => <span className="font-medium font-tabular">{u.unit_number}</span> },
          { header: "Floor", render: (u) => floors.find((f) => f.id === u.floor)?.name ?? "—" },
          { header: "Type", render: (u) => u.unit_type },
          { header: "Tenant", render: (u) => u.current_tenant_name ?? "—" },
          { header: "Rent", render: (u) => u.monthly_rent ? `ETB ${Number(u.monthly_rent).toLocaleString()}` : "—" },
          { header: "Status", render: (u) => <StatusBadge status={u.status} /> },
        ]}
      />
    </div>
  );
}
