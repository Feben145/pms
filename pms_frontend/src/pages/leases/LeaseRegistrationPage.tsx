/**
 * Full-page Lease Registration wizard, matching the established
 * pattern (Property/Building/Floor/Unit/Tenant). Property/Building/
 * Unit and Tenant contact details are read-only, derived from the
 * actual `unit`/`tenant` foreign keys -- same aggregation principle
 * used everywhere else, so a lease can never display a mismatched
 * property chain or stale tenant contact info.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Lease, LeaseDocument, Tenant, Unit } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";

type FormState = Partial<Lease>;

const EMPTY_FORM: FormState = {
  status: "draft",
  lease_version: "V1.0",
  currency: "ETB",
  billing_frequency: "monthly",
  payment_due_day: 1,
  approval_status: "pending",
  digital_signature_status: "not_signed",
};

export default function LeaseRegistrationPage() {
  const { leaseId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!leaseId;
  const navigate = useNavigate();
  const { items: tenants } = useCollection<Tenant>("/tenants/");
  const { items: units } = useCollection<Unit>("/properties/units/");

  const [form, setForm] = useState<FormState>(() => {
    const unitParam = searchParams.get("unit");
    const tenantParam = searchParams.get("tenant");
    return {
      ...EMPTY_FORM,
      ...(unitParam ? { unit: Number(unitParam) } : {}),
      ...(tenantParam ? { tenant: Number(tenantParam) } : {}),
    };
  });
  const [pendingDocs, setPendingDocs] = useState<{ name: string; file: File }[]>([]);
  const [existingDocs, setExistingDocs] = useState<LeaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<Lease>(`/leases/${leaseId}/`).then(({ data }) => {
      setForm(data);
      setExistingDocs(data.documents ?? []);
      setIsLoading(false);
    });
  }, [leaseId, isEdit]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingDocs((docs) => [...docs, { name: file.name, file }]);
    e.target.value = "";
  }

  async function handleSave() {
    if (!form.unit || !form.tenant) {
      setError("Select both a tenant and a unit.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
        if (key === "documents") return;
        const value = form[key];
        if (value === null || value === undefined || value === "") return;
        formData.append(key, String(value));
      });

      let savedId = leaseId;
      if (isEdit) {
        await apiClient.patch(`/leases/${leaseId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const { data } = await apiClient.post<Lease>("/leases/", formData, { headers: { "Content-Type": "multipart/form-data" } });
        savedId = String(data.id);
      }

      for (const doc of pendingDocs) {
        const docForm = new FormData();
        docForm.append("lease", savedId!);
        docForm.append("name", doc.name);
        docForm.append("file", doc.file);
        await apiClient.post("/leases/documents/", docForm, { headers: { "Content-Type": "multipart/form-data" } });
      }

      navigate("/leases");
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(typeof detail === "object" ? JSON.stringify(detail) : "Could not save lease. Check that the unit isn't already leased, and the end date is after the start date.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Lease Management", to: "/leases" }, { label: isEdit ? "Edit" : "New" }]} />

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{isEdit ? "Edit Lease" : "Lease Registration"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/leases")}>Cancel</Button>
          <Button variant="accent" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Lease
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger bg-[var(--color-danger-soft)] border border-danger/30 rounded-md px-3 py-2 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Card className="p-5">
          <Tabs defaultValue="identification">
            <TabsList>
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="parties">Tenant & Unit</TabsTrigger>
              <TabsTrigger value="dates">Dates & Terms</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="billing">Billing & Payment</TabsTrigger>
              <TabsTrigger value="approval">Approval</TabsTrigger>
              <TabsTrigger value="conditions">Terms & Conditions</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="identification">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Lease Number" required>
                  <Input value={form.lease_number ?? ""} onChange={(e) => set("lease_number", e.target.value)} placeholder="LSE-2026-001" />
                </Field>
                <Field label="Lease Version">
                  <Input value={form.lease_version ?? ""} onChange={(e) => set("lease_version", e.target.value)} />
                </Field>
                <Field label="Lease Type">
                  <Select value={form.lease_type || undefined} onValueChange={(v) => set("lease_type", v as Lease["lease_type"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Lease Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Lease["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="parties">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tenant" required>
                  <Select value={form.tenant ? String(form.tenant) : undefined} onValueChange={(v) => set("tenant", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select a tenant..." /></SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Unit" required>
                  <Select value={form.unit ? String(form.unit) : undefined} onValueChange={(v) => set("unit", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select a unit..." /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.unit_number} ({u.status})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {isEdit && form.property_name && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat label="Property" value={form.property_name} />
                  <ReadOnlyStat label="Building" value={form.building_name} />
                  <ReadOnlyStat label="Unit Number" value={form.unit_number} />
                  <ReadOnlyStat label="Tenant Contact" value={form.tenant_contact_number} />
                  <ReadOnlyStat label="Tenant Email" value={form.tenant_email} />
                  <ReadOnlyStat label="Tenant Type" value={form.tenant_type} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="dates">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Lease Start Date" required>
                  <Input type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} />
                </Field>
                <Field label="Lease End Date" required>
                  <Input type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} />
                </Field>
                <Field label="Move-in Date">
                  <Input type="date" value={form.move_in_date ?? ""} onChange={(e) => set("move_in_date", e.target.value)} />
                </Field>
                <Field label="Move-out Date">
                  <Input type="date" value={form.move_out_date ?? ""} onChange={(e) => set("move_out_date", e.target.value)} />
                </Field>
                <Field label="Renewal Notice Period (days)">
                  <Input type="number" value={form.renewal_notice_period_days ?? ""} onChange={(e) => set("renewal_notice_period_days", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              </div>
              {isEdit && form.lease_duration_days != null && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat label="Lease Duration" value={`${form.lease_duration_days} days`} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="financial">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly Rent" required>
                  <Input type="number" value={form.monthly_rent ?? ""} onChange={(e) => set("monthly_rent", e.target.value)} />
                </Field>
                <Field label="Security Deposit">
                  <Input type="number" value={form.security_deposit ?? ""} onChange={(e) => set("security_deposit", e.target.value)} />
                </Field>
                <Field label="Service Charge">
                  <Input type="number" value={form.service_charge ?? ""} onChange={(e) => set("service_charge", e.target.value)} />
                </Field>
                <Field label="Utility Charges">
                  <Input type="number" value={form.utility_charges ?? ""} onChange={(e) => set("utility_charges", e.target.value)} />
                </Field>
                <Field label="Parking Fee">
                  <Input type="number" value={form.parking_fee ?? ""} onChange={(e) => set("parking_fee", e.target.value)} />
                </Field>
                <Field label="Currency">
                  <Input value={form.currency ?? "ETB"} onChange={(e) => set("currency", e.target.value)} />
                </Field>
                <Field label="Payment Frequency">
                  <Select value={form.billing_frequency} onValueChange={(v) => set("billing_frequency", v as Lease["billing_frequency"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Payment Due Day">
                  <Input type="number" min={1} max={31} value={form.payment_due_day ?? 1} onChange={(e) => set("payment_due_day", Number(e.target.value))} />
                </Field>
                <Field label="Rent Escalation Type">
                  <Select value={form.rent_escalation_type || undefined} onValueChange={(v) => set("rent_escalation_type", v as Lease["rent_escalation_type"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_percent">Fixed %</SelectItem>
                      <SelectItem value="cpi_based">CPI-based</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Rent Escalation (%)">
                  <Input type="number" value={form.rent_escalation_percent ?? ""} onChange={(e) => set("rent_escalation_percent", e.target.value)} />
                </Field>
              </div>
              {isEdit && form.total_monthly_charge && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat label="Total Monthly Charge" value={`${form.currency} ${Number(form.total_monthly_charge).toLocaleString()}`} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="billing">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Invoice Generation Day">
                  <Input type="number" min={1} max={31} value={form.invoice_generation_day ?? ""} onChange={(e) => set("invoice_generation_day", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Payment Method">
                  <Select value={form.payment_method || undefined} onValueChange={(v) => set("payment_method", v as Lease["payment_method"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Bank Account">
                  <Input value={form.bank_account ?? ""} onChange={(e) => set("bank_account", e.target.value)} />
                </Field>
                <Field label="Late Payment Penalty (%)">
                  <Input type="number" value={form.late_payment_penalty_percent ?? ""} onChange={(e) => set("late_payment_penalty_percent", e.target.value)} />
                </Field>
                <Field label="Grace Period (days)">
                  <Input type="number" value={form.grace_period_days ?? ""} onChange={(e) => set("grace_period_days", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              </div>
              {isEdit && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat
                    label="Outstanding Balance"
                    value={`${form.currency ?? "ETB"} ${Number(form.outstanding_balance ?? 0).toLocaleString()}`}
                    danger={Number(form.outstanding_balance ?? 0) > 0}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="approval">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Approval Status">
                  <Select value={form.approval_status} onValueChange={(v) => set("approval_status", v as Lease["approval_status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Approval Date">
                  <Input type="date" value={form.approval_date ?? ""} onChange={(e) => set("approval_date", e.target.value)} />
                </Field>
                <Field label="Digital Signature Status">
                  <Select value={form.digital_signature_status} onValueChange={(v) => set("digital_signature_status", v as Lease["digital_signature_status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_signed">Not Signed</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {isEdit && form.approved_by_username && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat label="Approved By" value={form.approved_by_username} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="conditions">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Renewal Period (months)">
                  <Input type="number" value={form.renewal_period_months ?? ""} onChange={(e) => set("renewal_period_months", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Early Termination Notice (days)">
                  <Input type="number" value={form.early_termination_notice_days ?? ""} onChange={(e) => set("early_termination_notice_days", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Maintenance Responsibility">
                  <Select value={form.maintenance_responsibility || undefined} onValueChange={(v) => set("maintenance_responsibility", v as Lease["maintenance_responsibility"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent><SelectItem value="tenant">Tenant</SelectItem><SelectItem value="landlord">Landlord</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Pet Policy">
                  <Select value={form.pet_policy || undefined} onValueChange={(v) => set("pet_policy", v as Lease["pet_policy"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowed">Allowed</SelectItem>
                      <SelectItem value="not_allowed">Not Allowed</SelectItem>
                      <SelectItem value="case_by_case">Case-by-case</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ToggleField label="Renewal Option" checked={!!form.renewal_option} onChange={(v) => set("renewal_option", v)} />
                <ToggleField label="Early Termination Allowed" checked={!!form.early_termination_allowed} onChange={(v) => set("early_termination_allowed", v)} />
                <ToggleField label="Insurance Required" checked={!!form.insurance_required} onChange={(v) => set("insurance_required", v)} />
                <ToggleField label="Subletting Allowed" checked={!!form.subletting_allowed} onChange={(v) => set("subletting_allowed", v)} />
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <p className="text-sm text-muted-foreground mb-3">
                Upload the lease agreement, amendments, insurance certificate, or inspection reports. Files are attached once the lease is saved.
              </p>
              <label className="flex items-center gap-2 text-sm text-accent hover:underline cursor-pointer w-fit">
                <Upload className="h-4 w-4" /> Upload document
                <input type="file" className="hidden" onChange={handleDocSelect} />
              </label>
              <div className="mt-4 space-y-2">
                {existingDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {doc.name}</span>
                    <a href={doc.file} target="_blank" rel="noreferrer" className="text-accent hover:underline text-xs">View</a>
                  </div>
                ))}
                {pendingDocs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between border border-dashed border-border rounded-md px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {doc.name} <span className="text-xs text-muted-foreground">(pending upload)</span></span>
                    <button onClick={() => setPendingDocs((docs) => docs.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                    </button>
                  </div>
                ))}
                {existingDocs.length === 0 && pendingDocs.length === 0 && (
                  <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="space-y-4">
          {isEdit && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Status</h3>
              <StatusBadge status={form.status ?? "draft"} />
            </Card>
          )}
          {isEdit && form.created_by && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{form.created_by_username ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{form.created_at ? new Date(form.created_at).toLocaleDateString() : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{form.updated_by_username ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{form.updated_at ? new Date(form.updated_at).toLocaleDateString() : "—"}</dd></div>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyStat({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-base font-semibold ${danger ? "text-danger" : ""}`}>{value ?? "—"}</p>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border border-border rounded-md px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label} {required && <span className="text-danger">*</span>}</Label>
      {children}
    </div>
  );
}
