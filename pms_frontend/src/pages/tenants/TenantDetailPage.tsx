/**
 * Read-focused view of a tenant: profile summary, current lease chain,
 * full lease history (a tenant can have more than one lease over time),
 * financial summary, documents, and audit trail. Editing happens on a
 * separate page (TenantRegistrationPage in edit mode) reached via the
 * Edit button here -- this page is for looking, not filling in a form.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Mail, Phone } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Tenant, Lease } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { items: leases, isLoading: leasesLoading } = useCollection<Lease>("/leases/", { tenant: tenantId! });

  useEffect(() => {
    apiClient.get<Tenant>(`/tenants/${tenantId}/`).then(({ data }) => {
      setTenant(data);
      setIsLoading(false);
    });
  }, [tenantId]);

  if (isLoading || !tenant) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  const hasOutstanding = Number(tenant.outstanding_balance) > 0;

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Tenant", to: "/tenants" }, { label: tenant.full_name }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{tenant.full_name}</h1>
            <StatusBadge status={tenant.status} />
          </div>
          <p className="text-sm text-muted-foreground font-tabular">{tenant.tenant_id_display} {tenant.tenant_code && `· ${tenant.tenant_code}`}</p>
        </div>
        <Button variant="accent" onClick={() => navigate(`/tenants/${tenantId}/edit`)}>Edit Tenant</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Type" value={tenant.tenant_type === "company" ? "Company" : "Individual"} />
        <StatCard label="KYC Status" value={tenant.kyc_verified ? "Verified" : "Pending"} />
        <StatCard label="Current Unit" value={tenant.current_unit_number ?? "—"} />
        <StatCard label="Outstanding Balance" value={`ETB ${Number(tenant.outstanding_balance).toLocaleString()}`} danger={hasOutstanding} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={Phone} label="Mobile" value={tenant.phone_number} />
              <InfoRow icon={Mail} label="Email" value={tenant.email || "—"} />
              <InfoRow label="Alternate Phone" value={tenant.alternate_phone || "—"} />
              <InfoRow label="Address" value={tenant.current_address || "—"} />
              {tenant.tenant_type === "company" && (
                <>
                  <InfoRow label="Company" value={tenant.company_name || "—"} />
                  <InfoRow label="Contact Person" value={tenant.contact_person || "—"} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lease History</CardTitle></CardHeader>
            <CardContent>
              {leasesLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : leases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No leases yet for this tenant.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Lease #</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leases.map((lease) => (
                      <TableRow key={lease.id} className="cursor-pointer" onClick={() => navigate(`/leases/${lease.id}`)}>
                        <TableCell className="font-medium font-tabular">{lease.lease_number}</TableCell>
                        <TableCell className="font-tabular">{lease.unit_number}</TableCell>
                        <TableCell className="text-muted-foreground">{lease.start_date} → {lease.end_date}</TableCell>
                        <TableCell className="text-right font-tabular">ETB {Number(lease.monthly_rent).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={lease.status} /></TableCell>
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
              {tenant.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {tenant.documents.map((doc) => (
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
            <h3 className="text-sm font-medium text-foreground mb-3">Compliance</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">KYC</dt><dd>{tenant.kyc_verified ? "Verified" : "Pending"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Credit Check</dt><dd className="capitalize">{tenant.credit_check_status || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Background Check</dt><dd className="capitalize">{tenant.background_check_status || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Blacklisted</dt><dd className={tenant.blacklist_status ? "text-danger font-medium" : ""}>{tenant.blacklist_status ? "Yes" : "No"}</dd></div>
            </dl>
          </Card>

          {tenant.emergency_contact_name && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Emergency Contact</h3>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{tenant.emergency_contact_name}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Relationship</dt><dd>{tenant.emergency_contact_relationship || "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd className="font-tabular">{tenant.emergency_contact_phone || "—"}</dd></div>
              </dl>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{tenant.created_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{new Date(tenant.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{tenant.updated_by_username ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{new Date(tenant.updated_at).toLocaleDateString()}</dd></div>
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

function InfoRow({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
