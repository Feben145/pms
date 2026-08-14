import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Unit, UnitDocument, Floor } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { parseApiError } from "../../lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb } from "../../components/Breadcrumb";

type FormState = Partial<Unit>;

const EMPTY_FORM: FormState = { status: "draft", unit_type: "apartment", currency: "ETB" };

export default function UnitRegistrationPage() {
  const { unitId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!unitId;
  const navigate = useNavigate();
  const { items: floors } = useCollection<Floor>("/properties/floors/");

  const [form, setForm] = useState<FormState>(() => {
    const floorParam = searchParams.get("floor");
    return floorParam ? { ...EMPTY_FORM, floor: Number(floorParam) } : EMPTY_FORM;
  });
  const [pendingDocs, setPendingDocs] = useState<{ name: string; file: File }[]>([]);
  const [existingDocs, setExistingDocs] = useState<UnitDocument[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<Unit>(`/properties/units/${unitId}/`).then(({ data }) => {
      setForm(data);
      setExistingDocs(data.documents ?? []);
      setIsLoading(false);
    });
  }, [unitId, isEdit]);

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
    if (!form.floor) {
      setError("Select the floor this unit belongs to.");
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

      let savedId = unitId;
      if (isEdit) {
        await apiClient.patch(`/properties/units/${unitId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const { data } = await apiClient.post<Unit>("/properties/units/", formData, { headers: { "Content-Type": "multipart/form-data" } });
        savedId = String(data.id);
      }

      for (const doc of pendingDocs) {
        const docForm = new FormData();
        docForm.append("unit", savedId!);
        docForm.append("name", doc.name);
        docForm.append("file", doc.file);
        await apiClient.post("/properties/units/documents/", docForm, { headers: { "Content-Type": "multipart/form-data" } });
      }

      navigate(`/units`);
    } catch (err: any) {
      setError(parseApiError(err, "Could not save unit."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Unit", to: "/units" }, { label: isEdit ? "Edit" : "New" }]} />

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{isEdit ? "Edit Unit" : "Unit Registration"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/units")}>Cancel</Button>
          <Button variant="accent" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Unit
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger bg-[var(--color-danger-soft)] border border-danger/30 rounded-md px-3 py-2 mb-4 whitespace-pre-line">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Card className="p-5">
          <Tabs defaultValue="identification">
            <TabsList>
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="physical">Physical Details</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
              <TabsTrigger value="utilities">Utilities</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="identification">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Floor" required>
                  <Select value={form.floor ? String(form.floor) : undefined} onValueChange={(v) => set("floor", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select a floor..." /></SelectTrigger>
                    <SelectContent>
                      {floors.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name} — {f.building_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Unit Number" required>
                  <Input value={form.unit_number ?? ""} onChange={(e) => set("unit_number", e.target.value)} placeholder="A-101" />
                </Field>
                <Field label="Unit Name">
                  <Input value={form.unit_name ?? ""} onChange={(e) => set("unit_name", e.target.value)} placeholder="Apartment 101" />
                </Field>
                <Field label="Unit Type" required>
                  <Select value={form.unit_type} onValueChange={(v) => set("unit_type", v as Unit["unit_type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="shop">Shop</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="hotel_room">Hotel Room</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Unit Category">
                  <Select value={form.unit_category || undefined} onValueChange={(v) => set("unit_category", v as Unit["unit_category"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed_use">Mixed-use</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Usage Type">
                  <Select value={form.usage_type || undefined} onValueChange={(v) => set("usage_type", v as Unit["usage_type"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ownership Type">
                  <Select value={form.ownership_type || undefined} onValueChange={(v) => set("ownership_type", v as Unit["ownership_type"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Owned</SelectItem>
                      <SelectItem value="leased">Leased</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Unit Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Unit["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="leased">Leased / Occupied</SelectItem>
                      <SelectItem value="expiring">Expiring</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance / Cleaning</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="physical">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Area (sqm)">
                  <Input type="number" value={form.area_sqm ?? ""} onChange={(e) => set("area_sqm", e.target.value)} />
                </Field>
                <Field label="Rentable Area (sqm)">
                  <Input type="number" value={form.rentable_area_sqm ?? ""} onChange={(e) => set("rentable_area_sqm", e.target.value)} />
                </Field>
                <Field label="Number of Bedrooms">
                  <Input type="number" value={form.number_of_bedrooms ?? ""} onChange={(e) => set("number_of_bedrooms", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Number of Bathrooms">
                  <Input type="number" value={form.number_of_bathrooms ?? ""} onChange={(e) => set("number_of_bathrooms", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Parking Space">
                  <Input value={form.parking_space ?? ""} onChange={(e) => set("parking_space", e.target.value)} placeholder="P-101" />
                </Field>
                <Field label="Storage Room">
                  <Input value={form.storage_room ?? ""} onChange={(e) => set("storage_room", e.target.value)} placeholder="ST-05" />
                </Field>
                <Field label="Accessibility Features">
                  <Input value={form.accessibility_features ?? ""} onChange={(e) => set("accessibility_features", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <ToggleField label="Balcony" checked={!!form.balcony} onChange={(v) => set("balcony", v)} />
                <ToggleField label="Kitchen" checked={!!form.kitchen} onChange={(v) => set("kitchen", v)} />
                <ToggleField label="Furnished" checked={!!form.furnished} onChange={(v) => set("furnished", v)} />
              </div>
            </TabsContent>

            <TabsContent value="financial">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly Rent">
                  <Input type="number" value={form.monthly_rent ?? ""} onChange={(e) => set("monthly_rent", e.target.value)} />
                </Field>
                <Field label="Security Deposit">
                  <Input type="number" value={form.security_deposit ?? ""} onChange={(e) => set("security_deposit", e.target.value)} />
                </Field>
                <Field label="Service Charge">
                  <Input type="number" value={form.service_charge ?? ""} onChange={(e) => set("service_charge", e.target.value)} />
                </Field>
                <Field label="Utility Billing Method">
                  <Select value={form.utility_billing_method || undefined} onValueChange={(v) => set("utility_billing_method", v as Unit["utility_billing_method"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metered">Metered</SelectItem>
                      <SelectItem value="fixed_rate">Fixed Rate</SelectItem>
                      <SelectItem value="included">Included</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Currency">
                  <Input value={form.currency ?? "ETB"} onChange={(e) => set("currency", e.target.value)} />
                </Field>
              </div>
              <div className="mt-4">
                <ToggleField label="VAT Applicable" checked={!!form.vat_applicable} onChange={(v) => set("vat_applicable", v)} />
              </div>
            </TabsContent>

            <TabsContent value="occupancy">
              {isEdit && form.current_tenant_name ? (
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyStat label="Current Tenant" value={form.current_tenant_name} />
                  <ReadOnlyStat label="Lease ID" value={form.current_lease_id ? `#${form.current_lease_id}` : "—"} />
                  <ReadOnlyStat label="Lease Start" value={form.lease_start_date} />
                  <ReadOnlyStat label="Lease End" value={form.lease_end_date} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isEdit ? "This unit has no active lease." : "Occupancy details appear once this unit has an active lease — derived automatically from the Leases module, not entered here."}
                </p>
              )}
            </TabsContent>

            <TabsContent value="utilities">
              <p className="text-sm text-muted-foreground mb-3">
                Meter/account references identify the physical connections. Charges below are the unit's standard monthly rates — a Lease reads these automatically once this unit is selected, rather than having its own separate utility fields.
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meter References</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Electricity Meter Number">
                  <Input value={form.electricity_meter_number ?? ""} onChange={(e) => set("electricity_meter_number", e.target.value)} />
                </Field>
                <Field label="Water Meter Number">
                  <Input value={form.water_meter_number ?? ""} onChange={(e) => set("water_meter_number", e.target.value)} />
                </Field>
                <Field label="Gas Meter Number">
                  <Input value={form.gas_meter_number ?? ""} onChange={(e) => set("gas_meter_number", e.target.value)} />
                </Field>
                <Field label="Utility Account Number">
                  <Input value={form.utility_account_number ?? ""} onChange={(e) => set("utility_account_number", e.target.value)} />
                </Field>
              </div>
              <div className="mb-4">
                <ToggleField label="Internet Connection" checked={!!form.internet_connection} onChange={(v) => set("internet_connection", v)} />
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pt-2 border-t border-border">Standard Monthly Charges</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Electricity Charge">
                  <Input type="number" value={(form as any).electricity_charge ?? ""} onChange={(e) => set(("electricity_charge" as any), parseFloat(e.target.value))} />
                </Field>
                <Field label="Water Charge">
                  <Input type="number" value={(form as any).water_charge ?? ""} onChange={(e) => set(("water_charge" as any), parseFloat(e.target.value))} />
                </Field>
                <Field label="Gas Charge">
                  <Input type="number" value={(form as any).gas_charge ?? ""} onChange={(e) => set(("gas_charge" as any), parseFloat(e.target.value))} />
                </Field>
                <Field label="Internet Charge">
                  <Input type="number" value={(form as any).internet_charge ?? ""} onChange={(e) => set(("internet_charge" as any), parseFloat(e.target.value))} />
                </Field>
                <Field label="Other Utility Charge">
                  <Input type="number" value={(form as any).other_utility_charge ?? ""} onChange={(e) => set(("other_utility_charge" as any), parseFloat(e.target.value))} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="maintenance">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Maintenance Status">
                  <Select value={form.maintenance_status || undefined} onValueChange={(v) => set("maintenance_status", v as Unit["maintenance_status"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Last Inspection Date">
                  <Input type="date" value={form.last_inspection_date ?? ""} onChange={(e) => set("last_inspection_date", e.target.value)} />
                </Field>
                <Field label="Next Inspection Date">
                  <Input type="date" value={form.next_inspection_date ?? ""} onChange={(e) => set("next_inspection_date", e.target.value)} />
                </Field>
                <Field label="Warranty Expiry">
                  <Input type="date" value={form.warranty_expiry ?? ""} onChange={(e) => set("warranty_expiry", e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="features">
              <div className="grid grid-cols-3 gap-4">
                <ToggleField label="Air Conditioning" checked={!!form.air_conditioning} onChange={(v) => set("air_conditioning", v)} />
                <ToggleField label="Heating" checked={!!form.heating} onChange={(v) => set("heating", v)} />
                <ToggleField label="Smart Lock" checked={!!form.smart_lock} onChange={(v) => set("smart_lock", v)} />
                <ToggleField label="Smoke Detector" checked={!!form.smoke_detector} onChange={(v) => set("smoke_detector", v)} />
                <ToggleField label="CCTV Coverage" checked={!!form.cctv_coverage} onChange={(v) => set("cctv_coverage", v)} />
                <ToggleField label="Internet Ready" checked={!!form.internet_ready} onChange={(v) => set("internet_ready", v)} />
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <p className="text-sm text-muted-foreground mb-3">
                Upload floor plan, occupancy certificate, inspection report, or photos. Files are attached once the unit is saved.
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

function ReadOnlyStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value ?? "—"}</p>
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
