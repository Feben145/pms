/**
 * Full-page Lease Registration wizard. Status and lease_version are
 * intentionally NOT form fields -- status starts at Draft always (the
 * backend enforces this regardless of what's sent) and only advances
 * via the Approve action on the list/detail page; lease_version
 * auto-increments server-side on every edit. Property/Building/Floor
 * selection is cascading so the tenant/unit picker always shows the
 * real hierarchy instead of a flat, hard-to-navigate unit list.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Lease, LeaseDocument, Tenant, Unit, Floor, Building, Property } from "../../types/models";
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
  currency: "ETB",
  billing_frequency: "monthly",
  payment_due_day: 1,
  invoice_generation_term_type: "fixed",
};

export default function LeaseRegistrationPage() {
  const { leaseId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!leaseId;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingDocs, setPendingDocs] = useState<{ name: string; file: File }[]>([]);
  const [existingDocs, setExistingDocs] = useState<LeaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- Cascading hierarchy selection state (not saved directly -- only
  // the final `unit` id is persisted on the Lease) --
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const { items: properties } = useCollection<Property>("/properties/");
  const { items: buildings } = useCollection<Building>(
    "/properties/buildings/",
    selectedProperty ? { property: selectedProperty } : undefined
  );
  const { items: floors } = useCollection<Floor>(
    "/properties/floors/",
    selectedBuilding ? { building: selectedBuilding } : undefined
  );
  const { items: units } = useCollection<Unit>(
    "/properties/units/",
    selectedFloor ? { floor: selectedFloor } : undefined
  );
  const { items: tenants } = useCollection<Tenant>("/tenants/");


  useEffect(() => {
  if (!form.unit) {
    setSelectedUnit(null);
    return;
  }

  apiClient
    .get<Unit>(`/properties/units/${form.unit}/`)
    .then(({ data }) => {
      setSelectedUnit(data);
    })
    .catch(() => {
      setSelectedUnit(null);
    });
}, [form.unit]);
  useEffect(() => {
    if (!isEdit) {
      const unitParam = searchParams.get("unit");
      const tenantParam = searchParams.get("tenant");
      setForm((f) => ({
        ...f,
        ...(unitParam ? { unit: Number(unitParam) } : {}),
        ...(tenantParam ? { tenant: Number(tenantParam) } : {}),
      }));
      return;
    }
    apiClient.get<Lease>(`/leases/${leaseId}/`).then(({ data }) => {
      setForm(data);
      setExistingDocs(data.documents ?? []);
      setIsLoading(false);
    });
  }, [leaseId, isEdit, searchParams]);

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
        // status and lease_version are never sent -- the backend owns
        // both. Sending status would be silently ignored on create
        // anyway, but omitting it keeps the intent explicit here too.
        if (key === "documents" || key === "status" || key === "lease_version") return;
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

 function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Lease Management", to: "/leases" }, { label: isEdit ? "Edit" : "New" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{isEdit ? "Edit Lease" : "Lease Registration"}</h1>
          {isEdit && (
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={form.status ?? "draft"} />
              <span className="text-xs text-muted-foreground font-tabular">{form.lease_version}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/leases")}>Cancel</Button>
          <Button variant="accent" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Lease
          </Button>
        </div>
      </div>

      {!isEdit && (
        <p className="text-xs text-muted-foreground mb-4">
          New leases are always saved as <span className="font-medium">Draft</span>. An Owner or Property Manager approves it from the list or detail page to make it Active.
        </p>
      )}

      {error && (
        <p className="text-sm text-dangerbg-[var(--color-danger-soft)] border border-danger/30 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Card className="p-5">
          <Tabs defaultValue="identification">
            <TabsList>
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="parties">Tenant & Unit</TabsTrigger>
              <TabsTrigger value="dates">Dates & Terms</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="utilities">Utilities & Charges</TabsTrigger>
              <TabsTrigger value="billing">Billing & Payment</TabsTrigger>
              <TabsTrigger value="conditions">Terms & Conditions</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="identification">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Lease Number" required>
                  <Input value={form.lease_number ?? ""} onChange={(e) => set("lease_number", e.target.value)} placeholder="LSE-2026-001" />
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
              </div>
            </TabsContent>
            <TabsContent value="parties">
              <p className="text-sm font-medium text-foreground mb-1">Property Hierarchy</p>
              <p className="text-xs text-muted-foreground mb-3">Narrow down to the exact unit through the real portfolio structure.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Property">
                  <Select value={selectedProperty ? String(selectedProperty) : undefined} onValueChange={(v) => { setSelectedProperty(Number(v)); setSelectedBuilding(null); setSelectedFloor(null); }}>
                    <SelectTrigger><SelectValue placeholder="Select a property..." /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Building">
                  <Select value={selectedBuilding ? String(selectedBuilding) : undefined} onValueChange={(v) => { setSelectedBuilding(Number(v)); setSelectedFloor(null); }} disabled={!selectedProperty}>
                    <SelectTrigger><SelectValue placeholder={selectedProperty ? "Select a building..." : "Select a property first"} /></SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Floor">
                  <Select value={selectedFloor ? String(selectedFloor) : undefined} onValueChange={(v) => setSelectedFloor(Number(v))} disabled={!selectedBuilding}>
                    <SelectTrigger><SelectValue placeholder={selectedBuilding ? "Select a floor..." : "Select a building first"} /></SelectTrigger>
                    <SelectContent>
                      {floors.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Unit" required>
                  <Select value={form.unit ? String(form.unit) : undefined} onValueChange={(v) => set("unit", Number(v))} disabled={!selectedFloor && !form.unit}>
                    <SelectTrigger><SelectValue placeholder={selectedFloor ? "Select a unit..." : "Select a floor first"} /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.unit_number} ({u.status})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="pt-4 border-t border-border">
                <Field label="Tenant" required>
                  <Select value={form.tenant ? String(form.tenant) : undefined} onValueChange={(v) => set("tenant", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select a tenant..." /></SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.full_name}</SelectItem>)}
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

            <TabsContent value="utilities">
  <div className="space-y-6">

    {/* Unit Utility Configuration */}
    <div>
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">
          Unit Utility Configuration
        </p>
        <p className="text-xs text-muted-foreground">
          Physical utility configuration inherited from the selected unit.
          These values are maintained on the Unit and cannot be changed here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReadOnlyStat
          label="Electricity Meter"
          value={selectedUnit?.electricity_meter_number || "—"}
        />

        <ReadOnlyStat
          label="Water Meter"
          value={selectedUnit?.water_meter_number || "—"}
        />

        <ReadOnlyStat
          label="Gas Meter"
          value={selectedUnit?.gas_meter_number || "—"}
        />

        <ReadOnlyStat
          label="Utility Account"
          value={selectedUnit?.utility_account_number || "—"}
        />

        <ReadOnlyStat
          label="Billing Method"
          value={
            selectedUnit?.utility_billing_method
              ? formatLabel(selectedUnit.utility_billing_method)
              : "—"
          }
        />

        <ReadOnlyStat
          label="Internet Connection"
          value={selectedUnit?.internet_connection ? "Available" : "Not Available"}
        />
      </div>
    </div>

    {/* Lease Utility Price Setup */}
    <div className="pt-5 border-t border-border">
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">
          Lease Utility Price Setup
        </p>
        <p className="text-xs text-muted-foreground">
          Enter the charges agreed with this tenant for this lease.
          These values are independent of the unit configuration.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Electricity Charge">
          <Input
            type="number"
            min="0"
            value={form.electricity_charge ?? ""}
            onChange={(e) =>
              set(
                "electricity_charge",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>

        <Field label="Water Charge">
          <Input
            type="number"
            min="0"
            value={form.water_charge ?? ""}
            onChange={(e) =>
              set(
                "water_charge",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>

        <Field label="Gas Charge">
          <Input
            type="number"
            min="0"
            value={form.gas_charge ?? ""}
            onChange={(e) =>
              set(
                "gas_charge",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>

        <Field label="Internet Charge">
          <Input
            type="number"
            min="0"
            value={form.internet_charge ?? ""}
            onChange={(e) =>
              set(
                "internet_charge",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>

        <Field label="Other Utility Charge">
          <Input
            type="number"
            min="0"
            value={form.other_utility_charge ?? ""}
            onChange={(e) =>
              set(
                "other_utility_charge",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>

        <Field label="Parking Fee">
          <Input
            type="number"
            min="0"
            value={form.parking_fee ?? ""}
            onChange={(e) =>
              set(
                "parking_fee",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>
      </div>
    </div>

  </div>
</TabsContent>

            <TabsContent value="billing">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Invoice Generation Term">
                  <Select value={form.invoice_generation_term_type} onValueChange={(v) => set("invoice_generation_term_type", v as Lease["invoice_generation_term_type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed day of month</SelectItem>
                      <SelectItem value="relative">Relative to due date</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {form.invoice_generation_term_type === "relative" ? (
                  <Field label="Days Before Due Date">
                    <Input type="number" value={form.invoice_generation_relative_days ?? ""} onChange={(e) => set("invoice_generation_relative_days", e.target.value ? Number(e.target.value) : null)} />
                  </Field>
                ) : (
                  <Field label="Generation Day of Month">
                    <Input type="number" min={1} max={31} value={form.invoice_generation_day ?? ""} onChange={(e) => set("invoice_generation_day", e.target.value ? Number(e.target.value) : null)} />
                  </Field>
                )}
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

        {isEdit && form.created_by && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Approval</h3>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{form.approval_status}</dd></div>
                {form.approved_by_username && (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Approved By</dt><dd>{form.approved_by_username}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Approval Date</dt><dd className="font-tabular">{form.approval_date}</dd></div>
                  </>
                )}
              </dl>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between"><dt className="text-muted-foreground">Created By</dt><dd>{form.created_by_username ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-tabular">{form.created_at ? new Date(form.created_at).toLocaleDateString() : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Updated By</dt><dd>{form.updated_by_username ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Last updated</dt><dd className="font-tabular">{form.updated_at ? new Date(form.updated_at).toLocaleDateString() : "—"}</dd></div>
              </dl>
            </Card>
          </div>
        )}
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