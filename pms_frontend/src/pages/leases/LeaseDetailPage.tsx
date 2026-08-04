/**
 * Read-focused view of a lease: parties, unit/property chain, full
 * financial terms, related invoices with payment status, documents,
 * and audit trail. Editing happens on a separate page
 * (LeaseRegistrationPage in edit mode). The Approve action here is the
 * only way a lease moves from Draft to Active -- there's no status
 * dropdown anywhere in this app; the backend enforces this too.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Lease, Invoice } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { hasApprovalPrivilege } from "../../lib/approvals";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";

export default function LeaseDetailPage() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const { user } = useCurrentUser();
  const { items: invoices, isLoading: invoicesLoading } = useCollection<Invoice>("/rentals/", { lease: leaseId! });

  useEffect(() => {
    loadLease();
  }, [leaseId]);

  function loadLease() {
    apiClient.get<Lease>(`/leases/${leaseId}/`).then(({ data }) => {
      setLease(data);
      setIsLoading(false);
    });
  }

  async function handleTerminate() {
    if (!lease) return;
    if (!confirm(`Terminate lease ${lease.lease_number}? This frees up the unit for reassignment.`)) return;
    await apiClient.patch(`/leases/${leaseId}/`, { status: "terminated" });
    loadLease();
  }

  async function handleApprove() {
    if (!lease) return;
    setIsApproving(true);
    try {
      await apiClient.post(`/leases/${leaseId}/approve/`);
      loadLease();
    } catch {
      alert("Could not approve this lease. You may not have approval privileges.");
    } finally {
      setIsApproving(false);
    }
  }

  if (isLoading || !lease) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  const canTerminate = lease.status === "active" || lease.status === "renewal_pending";
  const canApprove = (lease.status === "draft" || lease.status === "pending_approval") && hasApprovalPrivilege(user?.role);
  const hasOutstanding = Number(lease.outstanding_balance) > 0;

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Lease Management", to: "/leases" }, { label: lease.lease_number }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{lease.lease_number}</h1>
            <StatusBadge status={lease.status} />
            <span className="text-xs text-muted-foreground font-tabular">{lease.lease_version}</span>
          </div>
          <p className="text-sm text-muted-foreground font-tabular">{lease.lease_id_display} · {lease.tenant_name} · {lease.unit_number}</p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Button variant="accent" disabled={isApproving} onClick={handleApprove}>
              <CheckCircle2 className="h-4 w-4" /> {isApproving ? "Approving..." : "Approve"}
            </Button>
          )}
          {canTerminate && (
            <Button variant="outline" className="text-danger border-danger/30 hover:bg-[var(--color-danger-soft)]" onClick={handleTerminate}>
              Terminate
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/leases/${leaseId}/edit`)}>Edit Lease</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Rent" value={`${lease.currency} ${Number(lease.monthly_rent).toLocaleString()}`} />
        <StatCard label="Security Deposit" value={`${lease.currency} ${Number(lease.security_deposit).toLocaleString()}`} />
        <StatCard label="Lease Term" value={`${lease.start_date} → ${lease.end_date}`} />
        <StatCard label="Outstanding Balance" value={`${lease.currency} ${Number(lease.outstanding_balance).toLocaleString()}`} danger={hasOutstanding} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Property & Tenant</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Property" value={lease.property_name} />
              <InfoRow label="Building" value={lease.building_name} />
              <InfoRow label="Unit" value={lease.unit_number} />
              <InfoRow label="Tenant" value={lease.tenant_name} />
              <InfoRow label="Tenant Contact" value={lease.tenant_contact_number} />
              <InfoRow label="Tenant Email" value={lease.tenant_email || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Utilities</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <InfoRow label="Electricity" value={lease.electricity_charge ? `${lease.currency} ${Number(lease.electricity_charge).toLocaleString()}` : "—"} />
              <InfoRow label="Water" value={lease.water_charge ? `${lease.currency} ${Number(lease.water_charge).toLocaleString()}` : "—"} />
              <InfoRow label="Gas" value={lease.gas_charge ? `${lease.currency} ${Number(lease.gas_charge).toLocaleString()}` : "—"} />
              <InfoRow label="Internet" value={lease.internet_charge ? `${lease.currency} ${Number(lease.internet_charge).toLocaleString()}` : "—"} />
              <InfoRow label="Other" value={lease.other_utility_charge ? `${lease.currency} ${Number(lease.other_utility_charge).toLocaleString()}` : "—"} />
              <InfoRow label="Parking" value={lease.parking_fee ? `${lease.currency} ${Number(lease.parking_fee).toLocaleString()}` : "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No invoices generated yet for this lease.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate("/invoices")}>
                        <TableCell className="font-medium font-tabular">{inv.invoice_number}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.due_date}</TableCell>
                        <TableCell className="text-right font-tabular">ETB {Number(inv.total_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-tabular">ETB {Number(inv.outstanding_balance).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
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
              {(lease.documents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {(lease.documents ?? []).map((doc) => (
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
            <h3 className="text-sm font-medium text-foreground mb-3">Terms & Conditions</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Renewal Option</dt><dd>{lease.renewal_option ? "Yes" : "No"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Early Termination</dt><dd>{lease.early_termination_allowed ? "Allowed" : "Not Allowed"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Insurance Required</dt><dd>{lease.insurance_required ? "Yes" : "No"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Subletting</dt><dd>{lease.subletting_allowed ? "Allowed" : "Not Allowed"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Pet Policy</dt><dd className="capitalize">{lease.pet_policy?.replace(/_/g, " ") || "—"}</dd></div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Approval</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{lease.approval_status}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Signature</dt><dd className="capitalize">{lease.digital_signature_status.replace("_", " ")}</dd></div>
              {lease.approved_by_username && (
                <>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Approved By</dt><dd>{lease.approved_by_username}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Approval Date</dt><dd className="font-tabular">{lease.approval_date}</dd></div>
                </>
              )}
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{lease.created_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{new Date(lease.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{lease.updated_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{new Date(lease.updated_at).toLocaleDateString()}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-semibold ${danger ? "text-danger" : ""}`}>{value}</p>
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