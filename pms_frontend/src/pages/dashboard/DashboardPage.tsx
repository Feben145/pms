/**
 * Decision-support dashboard: not just stats, but what needs a
 * property manager's attention today -- upcoming lease expirations,
 * overdue collections, and which properties are underperforming on
 * occupancy. Revenue trend and portfolio occupancy give the broader
 * picture. Every number here is computed from real records, following
 * the same aggregation principle used across the rest of the app.
 */

import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useCollection } from "../../hooks/useCollection";
import type { Invoice, Lease, Property, Tenant, Unit } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardHeader, CardTitle, CardValue, CardContent } from "@/components/ui/card";
import { OccupancyBar } from "../../components/OccupancyBar";
import { AlertTriangle, TrendingUp, CalendarClock, Wallet } from "lucide-react";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { items: properties } = useCollection<Property>("/properties/");
  const { items: units } = useCollection<Unit>("/properties/units/");
  const { items: tenants } = useCollection<Tenant>("/tenants/");
  const { items: leases } = useCollection<Lease>("/leases/");
  const { items: invoices } = useCollection<Invoice>("/rentals/");

  const countByStatus = (status: Unit["status"]) => units.filter((u) => u.status === status).length;
  const leasedUnits = countByStatus("leased");
  const occupancyRate = units.length > 0 ? Math.round((leasedUnits / units.length) * 100) : 0;
  const activeLeases = leases.filter((l) => l.status === "active").length;

  // --- Revenue trend: last 6 months, collected vs invoiced ---
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
  const revenueTrend = monthBuckets.map(({ year, month, label }) => {
    const monthInvoices = invoices.filter((inv) => {
      const d = new Date(inv.due_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const invoiced = monthInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const collected = monthInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.outstanding_balance)), 0);
    return { label, invoiced: Math.round(invoiced), collected: Math.round(collected) };
  });

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

  return (
    <div>
      <PageHeader title="Dashboard" description="Portfolio overview and what needs your attention" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Properties" value={properties.length} onClick={() => navigate("/properties")} />
        <StatCard label="Active Leases" value={activeLeases} onClick={() => navigate("/leases")} />
        <StatCard label="Tenants" value={tenants.length} onClick={() => navigate("/tenants")} />
        <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Revenue Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: any) => [`ETB ${Number(value).toLocaleString()}`, ""]}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="invoiced" fill="var(--muted)" radius={[3, 3, 0, 0]} name="Invoiced" />
                  <Bar dataKey="collected" fill="var(--accent)" radius={[3, 3, 0, 0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Collections Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
            <p className={`text-2xl font-semibold font-tabular mb-4 ${totalOutstanding > 0 ? "text-danger" : ""}`}>
              ETB {totalOutstanding.toLocaleString()}
            </p>
            {overdueInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue invoices — collections are current.</p>
            ) : (
              <div className="space-y-2">
                {overdueInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 -mx-1 px-1 py-0.5 rounded" onClick={() => navigate("/invoices")}>
                    <span className="font-tabular text-muted-foreground">{inv.invoice_number}</span>
                    <span className="font-tabular text-danger font-medium">ETB {Number(inv.outstanding_balance).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
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
      </div>

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
  );
}

function StatCard({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : undefined}>
      <CardHeader className="pb-0">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <CardValue>{value}</CardValue>
      </CardContent>
    </Card>
  );
}