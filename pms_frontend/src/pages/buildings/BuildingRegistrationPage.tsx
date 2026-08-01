/**
 * Full-page Building Registration wizard, mirroring the Property
 * wizard's pattern exactly (tabs, Save as Draft-equivalent via status
 * field, Documents tab with pending/uploaded files, Audit panel) so
 * the workflow feels identical across modules.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Building, BuildingDocument, Property } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "../../components/Breadcrumb";
import { Switch } from "@/components/ui/switch";

type FormState = Partial<Building>;

const EMPTY_FORM: FormState = {
  status: "active",
  number_of_basement_floors: 0,
  number_of_elevators: 0,
};

export default function BuildingRegistrationPage() {
  const { buildingId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!buildingId;
  const navigate = useNavigate();
  const { items: properties } = useCollection<Property>("/properties/");

  const [form, setForm] = useState<FormState>(() => {
    const propertyParam = searchParams.get("property");
    return propertyParam ? { ...EMPTY_FORM, property: Number(propertyParam) } : EMPTY_FORM;
  });
  const [pendingDocs, setPendingDocs] = useState<{ name: string; file: File }[]>([]);
  const [existingDocs, setExistingDocs] = useState<BuildingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<Building>(`/properties/buildings/${buildingId}/`).then(({ data }) => {
      setForm(data);
      setExistingDocs(data.documents ?? []);
      setIsLoading(false);
    });
  }, [buildingId, isEdit]);

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
    if (!form.property) {
      setError("Select the property this building belongs to.");
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

      let savedId = buildingId;
      if (isEdit) {
        await apiClient.patch(`/properties/buildings/${buildingId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const { data } = await apiClient.post<Building>("/properties/buildings/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        savedId = String(data.id);
      }

      for (const doc of pendingDocs) {
        const docForm = new FormData();
        docForm.append("building", savedId!);
        docForm.append("name", doc.name);
        docForm.append("file", doc.file);
        await apiClient.post("/properties/buildings/documents/", docForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate(`/properties/${form.property}`);
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(typeof detail === "object" ? JSON.stringify(detail) : "Could not save building.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Property Management" },
          { label: "Building", to: "/buildings" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {isEdit ? "Edit Building" : "Building Registration"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/buildings")}>Cancel</Button>
          <Button variant="accent" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Building
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-[var(--color-danger-soft)] border border-danger/30 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Card className="p-5">
          <Tabs defaultValue="identification">
            <TabsList>
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="facilities">Facilities</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="utilities">Utilities</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="identification">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Property" required>
                  <Select
                    value={form.property ? String(form.property) : undefined}
                    onValueChange={(v) => set("property", Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a property..." /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Building Code" required>
                  <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="BLD-A01" />
                </Field>
                <Field label="Building Name" required>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Tower A" />
                </Field>
                <Field label="Building Type">
                  <Select value={form.building_type || undefined} onValueChange={(v) => set("building_type", v as Building["building_type"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="mixed_use">Mixed-use</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Building Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Building["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_construction">Under Construction</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Block / Wing">
                  <Input value={form.block_wing ?? ""} onChange={(e) => set("block_wing", e.target.value)} placeholder="Block A" />
                </Field>
                <Field label="Street Address">
                  <Input value={form.street_address ?? ""} onChange={(e) => set("street_address", e.target.value)} />
                </Field>
                <Field label="GPS Latitude">
                  <Input value={form.gps_latitude ?? ""} onChange={(e) => set("gps_latitude", e.target.value)} />
                </Field>
                <Field label="GPS Longitude">
                  <Input value={form.gps_longitude ?? ""} onChange={(e) => set("gps_longitude", e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="structure">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Floors">
                  <Input type="number" value={form.number_of_floors ?? ""} onChange={(e) => set("number_of_floors", Number(e.target.value))} />
                </Field>
                <Field label="Number of Basement Floors">
                  <Input type="number" value={form.number_of_basement_floors ?? ""} onChange={(e) => set("number_of_basement_floors", Number(e.target.value))} />
                </Field>
                <Field label="Total Floor Area (sqm)">
                  <Input type="number" value={form.total_floor_area_sqm ?? ""} onChange={(e) => set("total_floor_area_sqm", e.target.value)} />
                </Field>
                <Field label="Rentable Area (sqm)">
                  <Input type="number" value={form.rentable_area_sqm ?? ""} onChange={(e) => set("rentable_area_sqm", e.target.value)} />
                </Field>
                <Field label="Building Height (m)">
                  <Input type="number" value={form.building_height_meters ?? ""} onChange={(e) => set("building_height_meters", e.target.value)} />
                </Field>
                <Field label="Construction Year">
                  <Input type="number" value={form.construction_year ?? ""} onChange={(e) => set("construction_year", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Completion Date">
                  <Input type="date" value={form.completion_date ?? ""} onChange={(e) => set("completion_date", e.target.value)} />
                </Field>
              </div>
              {isEdit && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat label="Total Units (actual)" value={form.total_units} />
                  <ReadOnlyStat label="Occupied Units" value={form.occupied_units} />
                  <ReadOnlyStat label="Occupancy Rate" value={form.occupancy_rate !== null && form.occupancy_rate !== undefined ? `${form.occupancy_rate}%` : "—"} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="facilities">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Elevators">
                  <Input type="number" value={form.number_of_elevators ?? ""} onChange={(e) => set("number_of_elevators", Number(e.target.value))} />
                </Field>
                <Field label="Parking Spaces">
                  <Input type="number" value={form.parking_capacity ?? ""} onChange={(e) => set("parking_capacity", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Water Supply">
                  <Input value={form.water_supply ?? ""} onChange={(e) => set("water_supply", e.target.value)} placeholder="Municipal" />
                </Field>
                <Field label="CCTV Coverage">
                  <Input value={form.cctv_coverage ?? ""} onChange={(e) => set("cctv_coverage", e.target.value)} placeholder="Full Coverage" />
                </Field>
                <Field label="Security Service">
                  <Input value={form.security_service ?? ""} onChange={(e) => set("security_service", e.target.value)} />
                </Field>
                <Field label="Access Control">
                  <Input value={form.access_control ?? ""} onChange={(e) => set("access_control", e.target.value)} placeholder="RFID Card" />
                </Field>
                <Field label="Emergency Exits">
                  <Input type="number" value={form.emergency_exits ?? ""} onChange={(e) => set("emergency_exits", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <ToggleField label="Generator Available" checked={!!form.generator_available} onChange={(v) => set("generator_available", v)} />
                <ToggleField label="Fire Protection System" checked={!!form.fire_protection_system} onChange={(v) => set("fire_protection_system", v)} />
                <ToggleField label="Reception Available" checked={!!form.reception_available} onChange={(v) => set("reception_available", v)} />
              </div>
            </TabsContent>

            <TabsContent value="maintenance">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Building Condition">
                  <Select value={form.building_condition || undefined} onValueChange={(v) => set("building_condition", v as Building["building_condition"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Maintenance Schedule">
                  <Select value={form.maintenance_schedule || undefined} onValueChange={(v) => set("maintenance_schedule", v as Building["maintenance_schedule"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
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

            <TabsContent value="utilities">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Main Electricity Meter">
                  <Input value={form.main_electricity_meter ?? ""} onChange={(e) => set("main_electricity_meter", e.target.value)} placeholder="ELE-1001" />
                </Field>
                <Field label="Main Water Meter">
                  <Input value={form.main_water_meter ?? ""} onChange={(e) => set("main_water_meter", e.target.value)} placeholder="WTR-2001" />
                </Field>
                <Field label="Internet Provider">
                  <Input value={form.internet_provider ?? ""} onChange={(e) => set("internet_provider", e.target.value)} placeholder="Ethio Telecom" />
                </Field>
                <Field label="HVAC System">
                  <Input value={form.hvac_system ?? ""} onChange={(e) => set("hvac_system", e.target.value)} placeholder="Central HVAC" />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="management">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Building Manager">
                  <Input value={form.building_manager ?? ""} onChange={(e) => set("building_manager", e.target.value)} />
                </Field>
                <Field label="Maintenance Supervisor">
                  <Input value={form.maintenance_supervisor ?? ""} onChange={(e) => set("maintenance_supervisor", e.target.value)} />
                </Field>
                <Field label="Cleaning Contractor">
                  <Input value={form.cleaning_contractor ?? ""} onChange={(e) => set("cleaning_contractor", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Field label="Building Permit Number">
                  <Input value={form.building_permit_number ?? ""} onChange={(e) => set("building_permit_number", e.target.value)} />
                </Field>
                <Field label="Occupancy Certificate">
                  <Input value={form.occupancy_certificate ?? ""} onChange={(e) => set("occupancy_certificate", e.target.value)} />
                </Field>
                <Field label="Insurance Policy Number">
                  <Input value={form.insurance_policy_number ?? ""} onChange={(e) => set("insurance_policy_number", e.target.value)} />
                </Field>
                <Field label="Architectural Drawing Reference">
                  <Input value={form.architectural_drawing_reference ?? ""} onChange={(e) => set("architectural_drawing_reference", e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <p className="text-sm text-muted-foreground mb-3">
                Upload supporting documents (permit, insurance, drawings). Files are attached once the building is saved.
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
      <p className="text-lg font-semibold font-tabular">{value ?? "—"}</p>
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
