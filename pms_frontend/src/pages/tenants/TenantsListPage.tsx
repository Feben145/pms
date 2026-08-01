import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Tenant } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumb } from "../../components/Breadcrumb";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function TenantsListPage() {
  const { items, isLoading, error } = useCollection<Tenant>("/tenants/");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = items.filter((t) => {
    const matchesSearch =
      !search ||
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant_code.toLowerCase().includes(search.toLowerCase()) ||
      t.phone_number.includes(search);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Tenant" }]} />
      <PageHeader
        title="Tenants"
        description="Everyone registered across your properties"
        action={
          <Button variant="accent" onClick={() => navigate("/tenants/new")}>
            <Plus className="h-4 w-4" /> New Tenant
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search by name, code, or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="application_submitted">Application Submitted</SelectItem>
            <SelectItem value="kyc_verification">KYC Verification</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="lease_signed">Lease Signed</SelectItem>
            <SelectItem value="active_tenant">Active Tenant</SelectItem>
            <SelectItem value="lease_renewal">Lease Renewal</SelectItem>
            <SelectItem value="move_out">Move-Out</SelectItem>
            <SelectItem value="former_tenant">Former Tenant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Tenant>
        isLoading={isLoading}
        rows={filtered}
        onRowClick={(row) => navigate(`/tenants/${row.id}`)}
        emptyMessage="No tenants registered yet."
        columns={[
          { header: "ID", render: (t) => <span className="font-tabular text-muted-foreground">{t.tenant_id_display}</span> },
          { header: "Name", render: (t) => <span className="font-medium">{t.full_name}</span> },
          { header: "Type", render: (t) => t.tenant_type },
          { header: "Phone", render: (t) => <span className="font-tabular">{t.phone_number || "—"}</span> },
          { header: "Current Unit", render: (t) => t.current_unit_number ?? "—" },
          { header: "KYC", render: (t) => (t.kyc_verified ? "Verified" : "Pending") },
          { header: "Status", render: (t) => <StatusBadge status={t.status} /> },
        ]}
      />
    </div>
  );
}
