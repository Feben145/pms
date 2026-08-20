/**
 * Decision-support dashboard: what needs a property manager's
 * attention today -- upcoming lease expirations, overdue collections,
 * underperforming properties -- plus quick actions to act on it
 * immediately. No chart clutter; every figure here is a number you'd
 * actually check before making a decision, computed from real records.
 */

import { useNavigate } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import type { Invoice, Lease, Property, Tenant, Unit } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardHeader, CardTitle, CardValue, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OccupancyBar } from "../../components/OccupancyBar";
import { AlertTriangle, CalendarClock, Wallet, Plus, Building2, Users, FileText, Receipt } from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { items: properties } = useCollection<Property>("/properties/");
  const { items: units } = useCollection<Unit>("/properties/units/");
  const { items: tenants } = useCollection<Tenant>("/tenants/");
  const { items: leases } = useCollection<Lease>("/leases/");
  
  const { items: invoices } = useCollection<Invoice>("/rentals/invoices/");

  const countByStatus = (status: Unit["status"]) => units.filter((u) => u.status === status).length;
  const leasedUnits = countByStatus("leased");
  const occupancyRate = units.length > 0 ? Math.round((leasedUnits / units.length) * 100) : 0;
  const activeLeases = leases.filter((l) => l.status === "active").length;

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const revenueThisMonth = invoices
    .filter((inv) => {
      const d = new Date(inv.due_date);
      return `${d.getFullYear()}-${d.getMonth()}` === thisMonthKey;
    })
    .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.outstanding_balance)), 0);

  // --- Upcoming lease expirations (next 60 days) ---
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const expiringLeases = leases
    .filter((l) => l.status === "active" && new Date(l.end_date) <= in60Days && new Date(l.end_date) >= now)
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 5);

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }

  // --- Overdue / at-risk collections ---
  const overdueInvoices = invoices
    .filter((inv) => Number(inv.outstanding_balance) > 0 && new Date(inv.due_date) < now)
    .sort((a, b) => Number(b.outstanding_balance) - Number(a.outstanding_balance))
    .slice(0, 5);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.outstanding_balance), 0);

  // --- Properties needing attention (lowest occupancy) ---
  const atRiskProperties = properties
    .filter((p) => p.occupancy_rate !== null && p.total_units_actual > 0)
    .sort((a, b) => (a.occupancy_rate ?? 0) - (b.occupancy_rate ?? 0))
    .slice(0, 5);

  const pendingLeases = leases.filter((l) => l.status === "draft" || l.status === "pending_approval").length;
  const pendingTenants = tenants.filter((t) => t.status !== "approved" && t.status !== "active_tenant" && t.status !== "former_tenant").length;

  return (
    <div>
      <PageHeader title="Dashboard" description="Portfolio overview and what needs your attention" />

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/properties/new")}>
          <Plus className="h-3.5 w-3.5" /> Property
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/tenants/new")}>
          <Plus className="h-3.5 w-3.5" /> Tenant
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/leases/new")}>
          <Plus className="h-3.5 w-3.5" /> Lease
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
          <Plus className="h-3.5 w-3.5" /> Invoice
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Properties" value={properties.length} icon={Building2} onClick={() => navigate("/properties")} />
        <StatCard label="Active Leases" value={activeLeases} icon={FileText} onClick={() => navigate("/leases")} />
        <StatCard label="Tenants" value={tenants.length} icon={Users} onClick={() => navigate("/tenants")} />
        <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-0"><CardTitle>Revenue This Month</CardTitle></CardHeader>
          <CardContent className="pt-1">
            <CardValue className="text-brass-dark">ETB {revenueThisMonth.toLocaleString()}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle>Outstanding Balance</CardTitle></CardHeader>
          <CardContent className="pt-1">
            <CardValue className={totalOutstanding > 0 ? "text-danger" : ""}>ETB {totalOutstanding.toLocaleString()}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle>Awaiting Approval</CardTitle></CardHeader>
          <CardContent className="pt-1">
            <CardValue>{pendingLeases + pendingTenants}</CardValue>
            <p className="text-xs text-muted-foreground mt-1">{pendingLeases} leases · {pendingTenants} tenants</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Leases Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringLeases.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No leases expiring in the next 60 days.</p>
            ) : (
              <div className="space-y-1">
                {expiringLeases.map((lease) => {
                  const days = daysUntil(lease.end_date);
                  return (
                    <div
                      key={lease.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded"
                      onClick={() => navigate(`/leases/${lease.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{lease.tenant_name}</p>
                        <p className="text-xs text-muted-foreground font-tabular">{lease.lease_number} · {lease.unit_number}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${days <= 14 ? "bg-[var(--color-danger-soft)] text-danger" : "bg-[var(--color-warning-soft)] text-warning"}`}>
                        {days} day{days !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Collections at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No overdue invoices — collections are current.</p>
            ) : (
              <div className="space-y-1">
                {overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded"
                    onClick={() => navigate("/invoices")}
                  >
                    <span className="text-sm font-tabular text-foreground">{inv.invoice_number}</span>
                    <span className="text-sm font-tabular text-danger font-medium">ETB {Number(inv.outstanding_balance).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Properties Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Not enough data yet to rank properties by occupancy.</p>
            ) : (
              <div className="space-y-3">
                {atRiskProperties.map((p) => (
                  <div key={p.id} className="cursor-pointer" onClick={() => navigate(`/properties/${p.id}`)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <span className="text-xs font-tabular text-muted-foreground">{p.occupancy_rate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${(p.occupancy_rate ?? 0) < 50 ? "bg-danger" : (p.occupancy_rate ?? 0) < 75 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${p.occupancy_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Portfolio Occupancy</CardTitle></CardHeader>
          <CardContent>
            <OccupancyBar
              segments={[
                { label: "Leased", value: countByStatus("leased"), className: "bg-[var(--color-success)]" },
                { label: "Vacant", value: countByStatus("vacant"), className: "bg-muted-foreground/30" },
                { label: "Reserved", value: countByStatus("reserved"), className: "bg-[var(--color-info)]" },
                { label: "Under maintenance", value: countByStatus("under_maintenance"), className: "bg-[var(--color-warning)]" },
                { label: "Blocked", value: countByStatus("blocked"), className: "bg-[var(--color-danger)]" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, onClick,
}: { label: string; value: string | number; icon: typeof Building2; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      <CardHeader className="pb-0 flex flex-row items-center justify-between">
        <CardTitle>{label}</CardTitle>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-1">
        <CardValue>{value}</CardValue>
      </CardContent>
    </Card>
  );
}