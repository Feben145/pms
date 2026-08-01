import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Floor, Building } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb } from "../../components/Breadcrumb";

type FormState = Partial<Floor>;

const EMPTY_FORM: FormState = { status: "active", floor_type: "residential" };

export default function FloorRegistrationPage() {
  const { floorId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!floorId;
  const navigate = useNavigate();
  const { items: buildings } = useCollection<Building>("/properties/buildings/");

  const [form, setForm] = useState<FormState>(() => {
    const buildingParam = searchParams.get("building");
    return buildingParam ? { ...EMPTY_FORM, building: Number(buildingParam) } : EMPTY_FORM;
  });
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<Floor>(`/properties/floors/${floorId}/`).then(({ data }) => {
      setForm(data);
      setIsLoading(false);
    });
  }, [floorId, isEdit]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.building) {
      setError("Select the building this floor belongs to.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
        const value = form[key];
        if (value === null || value === undefined || value === "") return;
        formData.append(key, String(value));
      });

      if (isEdit) {
        await apiClient.patch(`/properties/floors/${floorId}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await apiClient.post<Floor>("/properties/floors/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      navigate(`/floors`);
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(typeof detail === "object" ? JSON.stringify(detail) : "Could not save floor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div>
      <Breadcrumb items={[{ label: "Property Management" }, { label: "Floor", to: "/floors" }, { label: isEdit ? "Edit" : "New" }]} />

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{isEdit ? "Edit Floor" : "Floor Registration"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/floors")}>Cancel</Button>
          <Button variant="accent" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Floor
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger bg-[var(--color-danger-soft)] border border-danger/30 rounded-md px-3 py-2 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Card className="p-5">
          <Tabs defaultValue="identification">
            <TabsList>
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="safety">Safety & Access</TabsTrigger>
              <TabsTrigger value="maintenance">Utilities & Maintenance</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            <TabsContent value="identification">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Building" required>
                  <Select value={form.building ? String(form.building) : undefined} onValueChange={(v) => set("building", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select a building..." /></SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Floor Code">
                  <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="F01" />
                </Field>
                <Field label="Floor Name" required>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Ground Floor" />
                </Field>
                <Field label="Floor Number" required>
                  <Input type="number" value={form.floor_number ?? ""} onChange={(e) => set("floor_number", Number(e.target.value))} />
                </Field>
                <Field label="Floor Type">
                  <Select value={form.floor_type} onValueChange={(v) => set("floor_type", v as Floor["floor_type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Floor Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Floor["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {isEdit && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <ReadOnlyStat label="Total Units" value={form.total_units} />
                  <ReadOnlyStat label="Occupied" value={form.occupied_units} />
                  <ReadOnlyStat label="Vacant" value={form.vacant_units} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="structure">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Total Area (sqm)">
                  <Input type="number" value={form.total_area_sqm ?? ""} onChange={(e) => set("total_area_sqm", e.target.value)} />
                </Field>
                <Field label="Rentable Area (sqm)">
                  <Input type="number" value={form.rentable_area_sqm ?? ""} onChange={(e) => set("rentable_area_sqm", e.target.value)} />
                </Field>
                <Field label="Common Area (sqm)">
                  <Input type="number" value={form.common_area_sqm ?? ""} onChange={(e) => set("common_area_sqm", e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="safety">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Accessibility Features">
                  <Input value={form.accessibility_features ?? ""} onChange={(e) => set("accessibility_features", e.target.value)} placeholder="Wheelchair Access, Elevator" />
                </Field>
                <Field label="Emergency Exit Count">
                  <Input type="number" value={form.emergency_exit_count ?? ""} onChange={(e) => set("emergency_exit_count", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Fire Safety Equipment">
                  <Input value={form.fire_safety_equipment ?? ""} onChange={(e) => set("fire_safety_equipment", e.target.value)} placeholder="Smoke Detectors, Fire Extinguishers" />
                </Field>
                <Field label="Security Zone">
                  <Input value={form.security_zone ?? ""} onChange={(e) => set("security_zone", e.target.value)} placeholder="Zone A" />
                </Field>
              </div>
              <div className="mt-4">
                <ToggleField label="CCTV Coverage" checked={!!form.cctv_coverage} onChange={(v) => set("cctv_coverage", v)} />
              </div>
            </TabsContent>

            <TabsContent value="maintenance">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Utility Meter ID">
                  <Input value={form.utility_meter_id ?? ""} onChange={(e) => set("utility_meter_id", e.target.value)} placeholder="MTR-10045" />
                </Field>
                <Field label="Next Maintenance Date">
                  <Input type="date" value={form.next_maintenance_date ?? ""} onChange={(e) => set("next_maintenance_date", e.target.value)} />
                </Field>
                <Field label="Cleaning Schedule">
                  <Select value={form.cleaning_schedule || undefined} onValueChange={(v) => set("cleaning_schedule", v as Floor["cleaning_schedule"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="management">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Floor Manager">
                  <Input value={form.floor_manager ?? ""} onChange={(e) => set("floor_manager", e.target.value)} />
                </Field>
              </div>
              <Field label="Remarks">
                <Textarea rows={4} value={form.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} placeholder="VIP Office Floor" />
              </Field>
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
    <div className="flex items-center justify-between border border-border rounded-md px-3 py-2 max-w-xs">
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
