/**
 * Full-page Tenant Registration wizard. Tab structure follows the
 * reference design (Identity & Profile / Address & Contact / Lease &
 * Property / Financial & Emergency / Compliance & Documents), with one
 * deliberate change: "Lease & Property" and current rent/deposit are
 * READ-ONLY, derived from the tenant's actual Lease record rather than
 * free-text ID fields. Free-text property/unit IDs could point at
 * nothing or the wrong record; a derived value can't drift from reality
 * -- same principle used everywhere else in this app (Building, Floor,
 * Unit occupancy figures).
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Tenant, TenantDocument } from "../../types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb } from "../../components/Breadcrumb";

type FormState = Partial<Tenant>;

const EMPTY_FORM: FormState = {
  tenant_type: "individual",
  status: "prospect",
  country: "Ethiopia",
  nationality: "Ethiopian",
};

export default function TenantRegistrationPage() {
  const { tenantId } = useParams();
  const isEdit = !!tenantId;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingDocs, setPendingDocs] = useState<{ name: string; file: File }[]>([]);
  const [existingDocs, setExistingDocs] = useState<TenantDocument[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<Tenant>(`/tenants/${tenantId}/`).then(({ data }) => {
      setForm(data);
      setExistingDocs(data.documents ?? []);
      setIsLoading(false);
    });
  }, [tenantId, isEdit]);

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

      let savedId = tenantId;
      if (isEdit) {
        await apiClient.patch(`/tenants/${tenantId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const { data } = await apiClient.post<Tenant>("/tenants/", formData, { headers: { "Content-Type": "multipart/form-data" } });
        savedId = String(data.id);
      }

      for (const doc of pendingDocs) {
        const docForm = new FormData();
        docForm.append("tenant", savedId!);
        docForm.append("name", doc.name);
        docForm.append("file", doc.file);
        await apiClient.post("/tenants/documents/", docForm, { headers: { "Content-Type": "multipart/form-data" } });
      }

      navigate("/tenants");
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(typeof detail === "object" ? JSON.stringify(detail) : "Could not save tenant. Check the required fields.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;

  const isCompany = form.tenant_type === "company";

  return (
    <div>
      <Breadcrumb items={[{ label: "Tenant & Lease" }, { label: "Tenant", to: "/tenants" }, { label: isEdit ? "Edit" : "New" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{isEdit ? "Edit Tenant" : "Register New Tenant"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Capture identity, contact, compliance status, and supporting documents.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/tenants")}>Cancel</Button>
          <Button variant="accent" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Tenant Record
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger bg-[var(--color-danger-soft)] border border-danger/30 rounded-md px-3 py-2 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Card className="p-5">
          <Tabs defaultValue="identity">
            <TabsList>
              <TabsTrigger value="identity">Identity & Profile</TabsTrigger>
              <TabsTrigger value="address">Address & Contact</TabsTrigger>
              <TabsTrigger value="lease">Lease & Property</TabsTrigger>
              <TabsTrigger value="financial">Financial & Emergency</TabsTrigger>
              <TabsTrigger value="compliance">Compliance & Documents</TabsTrigger>
            </TabsList>

            {/* TAB 1: IDENTITY & PROFILE */}
            <TabsContent value="identity">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Tenant Type">
                  <Select value={form.tenant_type} onValueChange={(v) => set("tenant_type", v as Tenant["tenant_type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tenant Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Tenant["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                </Field>
                <Field label="Tenant Code">
                  <Input value={form.tenant_code ?? ""} onChange={(e) => set("tenant_code", e.target.value)} placeholder="TNT-1001" />
                </Field>
              </div>

              {!isCompany ? (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="First Name"><Input value={form.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} placeholder="Abebe" /></Field>
                  <Field label="Middle Name"><Input value={form.middle_name ?? ""} onChange={(e) => set("middle_name", e.target.value)} placeholder="Bekele" /></Field>
                  <Field label="Last Name"><Input value={form.last_name ?? ""} onChange={(e) => set("last_name", e.target.value)} placeholder="Kebede" /></Field>
                  <Field label="Full Legal Name" className="col-span-2">
                    <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} placeholder="Auto-filled from name parts if left blank" />
                  </Field>
                  <Field label="Date of Birth"><Input type="date" value={form.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value)} /></Field>
                  <Field label="Gender">
                    <Select value={form.gender || undefined} onValueChange={(v) => set("gender", v as Tenant["gender"])}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Nationality"><Input value={form.nationality ?? ""} onChange={(e) => set("nationality", e.target.value)} /></Field>
                  <Field label="National ID / Passport No."><Input value={form.national_id_or_business_reg ?? ""} onChange={(e) => set("national_id_or_business_reg", e.target.value)} placeholder="ID123456789" /></Field>
                  <Field label="Tax ID (TIN)"><Input value={form.tax_identification_number ?? ""} onChange={(e) => set("tax_identification_number", e.target.value)} placeholder="TIN-100245" /></Field>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Company Name" className="col-span-2"><Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} placeholder="ABC Trading PLC" /></Field>
                  <Field label="Contact Representative"><Input value={form.contact_person ?? ""} onChange={(e) => set("contact_person", e.target.value)} placeholder="John Doe" /></Field>
                  <Field label="Business Registration No."><Input value={form.business_registration_no ?? ""} onChange={(e) => set("business_registration_no", e.target.value)} placeholder="BR-12345" /></Field>
                  <Field label="Business License No."><Input value={form.business_license_no ?? ""} onChange={(e) => set("business_license_no", e.target.value)} placeholder="BL-56789" /></Field>
                  <Field label="VAT Registration No."><Input value={form.vat_registration_no ?? ""} onChange={(e) => set("vat_registration_no", e.target.value)} placeholder="VAT-10001" /></Field>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: ADDRESS & CONTACT */}
            <TabsContent value="address">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Mobile Number" required><Input value={form.phone_number ?? ""} onChange={(e) => set("phone_number", e.target.value)} placeholder="+251911234567" /></Field>
                <Field label="Alternate Phone"><Input value={form.alternate_phone ?? ""} onChange={(e) => set("alternate_phone", e.target.value)} placeholder="+251922345678" /></Field>
                <Field label="Email Address"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="tenant@example.com" /></Field>
                <Field label="Preferred Contact Method">
                  <Select value={form.preferred_contact_method || undefined} onValueChange={(v) => set("preferred_contact_method", v as Tenant["preferred_contact_method"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Current Street Address" className="col-span-2"><Input value={form.current_address ?? ""} onChange={(e) => set("current_address", e.target.value)} placeholder="Bole Road, House No. 125" /></Field>
                <Field label="Country"><Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} /></Field>
                <Field label="Region"><Input value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="Addis Ababa" /></Field>
                <Field label="Sub-City"><Input value={form.sub_city ?? ""} onChange={(e) => set("sub_city", e.target.value)} placeholder="Bole" /></Field>
                <Field label="Woreda"><Input value={form.woreda ?? ""} onChange={(e) => set("woreda", e.target.value)} placeholder="Woreda 03" /></Field>
                <Field label="Postal Code"><Input value={form.postal_code ?? ""} onChange={(e) => set("postal_code", e.target.value)} placeholder="1000" /></Field>
              </div>
            </TabsContent>

            {/* TAB 3: LEASE & PROPERTY (read-only, derived) */}
            <TabsContent value="lease">
              {isEdit && form.current_lease_number ? (
                <div className="grid grid-cols-3 gap-4">
                  <ReadOnlyStat label="Property" value={form.current_property_name} />
                  <ReadOnlyStat label="Building" value={form.current_building_name} />
                  <ReadOnlyStat label="Floor" value={form.current_floor_name} />
                  <ReadOnlyStat label="Unit" value={form.current_unit_number} />
                  <ReadOnlyStat label="Lease Number" value={form.current_lease_number} />
                  <ReadOnlyStat label="Lease Start" value={form.lease_start_date} />
                  <ReadOnlyStat label="Lease End" value={form.lease_end_date} />
                  <ReadOnlyStat label="Move-in Date" value={form.move_in_date} />
                  <ReadOnlyStat label="Move-out Date" value={form.move_out_date} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? "This tenant has no lease yet."
                    : "Lease and property assignment appear here automatically once this tenant signs a lease — assign it from the Leases module, not here, so it always matches the real record."}
                </p>
              )}
            </TabsContent>

            {/* TAB 4: FINANCIAL & EMERGENCY */}
            <TabsContent value="financial">
              {isEdit && form.current_lease_number && (
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
                  <ReadOnlyStat label="Monthly Rent" value={form.current_monthly_rent ? `ETB ${Number(form.current_monthly_rent).toLocaleString()}` : "—"} />
                  <ReadOnlyStat label="Security Deposit" value={form.current_security_deposit ? `ETB ${Number(form.current_security_deposit).toLocaleString()}` : "—"} />
                  <ReadOnlyStat
                    label="Outstanding Balance"
                    value={`ETB ${Number(form.outstanding_balance ?? 0).toLocaleString()}`}
                    danger={Number(form.outstanding_balance ?? 0) > 0}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <Field label="Preferred Payment Method">
                  <Select value={form.preferred_payment_method || undefined} onValueChange={(v) => set("preferred_payment_method", v as Tenant["preferred_payment_method"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Bank Name"><Input value={form.bank_name ?? ""} onChange={(e) => set("bank_name", e.target.value)} placeholder="Commercial Bank of Ethiopia" /></Field>
                <Field label="Bank Account Number"><Input value={form.bank_account_number ?? ""} onChange={(e) => set("bank_account_number", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <Field label="Emergency Contact Name"><Input value={form.emergency_contact_name ?? ""} onChange={(e) => set("emergency_contact_name", e.target.value)} placeholder="Sara Bekele" /></Field>
                <Field label="Relationship"><Input value={form.emergency_contact_relationship ?? ""} onChange={(e) => set("emergency_contact_relationship", e.target.value)} placeholder="Spouse" /></Field>
                <Field label="Emergency Phone"><Input value={form.emergency_contact_phone ?? ""} onChange={(e) => set("emergency_contact_phone", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <Field label="Preferred Language">
                  <Select value={form.preferred_language || undefined} onValueChange={(v) => set("preferred_language", v as Tenant["preferred_language"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="amharic">Amharic</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Accessibility Requirements"><Input value={form.accessibility_requirements ?? ""} onChange={(e) => set("accessibility_requirements", e.target.value)} placeholder="Wheelchair Access" /></Field>
              </div>
            </TabsContent>

            {/* TAB 5: COMPLIANCE & DOCUMENTS */}
            <TabsContent value="compliance">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="KYC Verification Status">
                  <div className="flex items-center justify-between border border-border rounded-md px-3 py-2 h-9">
                    <span className="text-sm">{form.kyc_verified ? "Verified" : "Pending"}</span>
                    <Switch checked={!!form.kyc_verified} onCheckedChange={(v) => set("kyc_verified", v)} />
                  </div>
                </Field>
                <Field label="Credit Check Status">
                  <Select value={form.credit_check_status || undefined} onValueChange={(v) => set("credit_check_status", v as Tenant["credit_check_status"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Background Check Status">
                  <Select value={form.background_check_status || undefined} onValueChange={(v) => set("background_check_status", v as Tenant["background_check_status"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between border border-border rounded-md px-3 py-2 max-w-xs">
                  <span className="text-sm text-foreground">Blacklist Status</span>
                  <Switch checked={!!form.blacklist_status} onCheckedChange={(v) => set("blacklist_status", v)} />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Upload ID copy, passport, lease agreement, business license, or proof of address. Files are attached once the tenant is saved.
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
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {isEdit && form.created_by && (
          <Card className="p-4 h-fit">
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

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label>{label} {required && <span className="text-danger">*</span>}</Label>
      {children}
    </div>
  );
}
