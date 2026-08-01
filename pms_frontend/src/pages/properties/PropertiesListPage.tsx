import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Property } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumb } from "../../components/Breadcrumb";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function PropertiesListPage() {
  const { items, isLoading, error } = useCollection<Property>("/properties/");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = items.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesType = typeFilter === "all" || p.property_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Property List" }]} />
      <PageHeader
        title="Properties"
        description="Every property in your portfolio"
        action={
          <Button variant="accent" onClick={() => navigate("/properties/new")}>
            <Plus className="h-4 w-4" /> New Property
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search by name, code, or city..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="mixed_use">Mixed-use</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="under_construction">Under Construction</SelectItem>
            <SelectItem value="ready_for_occupancy">Ready for Occupancy</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="partially_occupied">Partially Occupied</SelectItem>
            <SelectItem value="fully_occupied">Fully Occupied</SelectItem>
            <SelectItem value="under_renovation">Under Renovation</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Property>
        isLoading={isLoading}
        rows={filtered}
        onRowClick={(row) => navigate(`/properties/${row.id}`)}
        emptyMessage="No properties yet. Create your first property to get started."
        columns={[
          { header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
          { header: "Code", render: (p) => <span className="font-tabular text-muted-foreground">{p.code}</span> },
          { header: "Type", render: (p) => p.property_type.replace("_", " ") },
          { header: "City", render: (p) => p.city || "—" },
          { header: "Occupancy", render: (p) => p.occupancy_rate !== null ? `${p.occupancy_rate}%` : "—" },
          { header: "Status", render: (p) => <StatusBadge status={p.status} /> },
        ]}
      />
    </div>
  );
}