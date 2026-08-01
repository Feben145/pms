import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Lease } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumb } from "../../components/Breadcrumb";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function LeasesListPage() {
  const { items, isLoading, error, update } = useCollection<Lease>("/leases/");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = items.filter((l) => {
    const matchesSearch =
      !search ||
      l.lease_number.toLowerCase().includes(search.toLowerCase()) ||
      l.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.unit_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleTerminate(e: React.MouseEvent, lease: Lease) {
    e.stopPropagation();
    if (!confirm(`Terminate lease ${lease.lease_number}? This frees up the unit for reassignment.`)) return;
    await update(lease.id, { status: "terminated" });
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Lease Management" }]} />
      <PageHeader
        title="Leases"
        description="Active and past lease agreements"
        action={
          <Button variant="accent" onClick={() => navigate("/leases/new")}>
            <Plus className="h-4 w-4" /> New Lease
          </Button>
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search by lease #, tenant, or unit..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="awaiting_signature">Awaiting Signature</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="renewal_pending">Renewal Pending</SelectItem>
            <SelectItem value="renewed">Renewed</SelectItem>
            <SelectItem value="amended">Amended</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Lease>
        isLoading={isLoading}
        rows={filtered}
        onRowClick={(row) => navigate(`/leases/${row.id}`)}
        emptyMessage="No leases yet."
        columns={[
          { header: "Lease #", render: (l) => <span className="font-medium font-tabular">{l.lease_number}</span> },
          { header: "Tenant", render: (l) => l.tenant_name },
          { header: "Unit", render: (l) => <span className="font-tabular">{l.unit_number}</span> },
          { header: "Term", render: (l) => <span className="text-muted-foreground">{l.start_date} → {l.end_date}</span> },
          { header: "Rent", render: (l) => <span className="font-tabular">ETB {Number(l.monthly_rent).toLocaleString()}</span> },
          { header: "Status", render: (l) => <StatusBadge status={l.status} /> },
          {
            header: "",
            render: (l) =>
              l.status === "active" || l.status === "renewal_pending" ? (
                <Button variant="link" size="sm" className="h-auto p-0 text-danger" onClick={(e) => handleTerminate(e, l)}>
                  Terminate
                </Button>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
