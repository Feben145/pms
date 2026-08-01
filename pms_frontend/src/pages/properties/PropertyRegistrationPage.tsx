/**
 * Full-page Property Registration wizard: General / Ownership / Location
 * / Property Details / Financial / Documents / Notes tabs, matching the
 * reference design. Unlike a step-by-step wizard, tabs are freely
 * clickable in any order -- the whole form is one object, submitted
 * together via "Save as Draft" or "Save & Activate".
 *
 * Handles both create (/properties/new) and edit
 * (/properties/:propertyId/edit) in one component, since the two flows
 * share the same fields; only the submit verb (POST vs PATCH) and
 * whether we pre-fetch existing data differ.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { apiClient } from "../../api/client";
import type { Property, PropertyDocument } from "../../types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "../../components/Breadcrumb";

type FormState = Partial<Property>;

const EMPTY_FORM: FormState = {
  property_type: "residential",
  status: "draft",
  operational_status: "operational",
  country: "Ethiopia",
  property_condition: "",
};

export default function PropertyRegistrationPage() {
  const { propertyId } = useParams();
  const isEdit = !!propertyId;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingDocs, setPendingDocs] = useState<{ name: string; file: File }[]>([]);
  const [existingDocs, setExistingDocs] = useState<PropertyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<Property>(`/properties/${propertyId}/`).then(({ data }) => {
      setForm(data);
      setExistingDocs(data.documents ?? []);
      if (data.image) setImagePreview(data.image);
      setIsLoading(false);
    });
  }, [propertyId, isEdit]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingDocs((docs) => [...docs, { name: file.name, file }]);
    e.target.value = "";
  }

  async function handleSave(targetStatus: "draft" | "active") {
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      const payload = { ...form, status: targetStatus };

      (Object.keys(payload) as (keyof FormState)[]).forEach((key) => {
        if (key === "documents" || key === "image") return;
        const value = payload[key];
        if (value === null || value === undefined || value === "") return;
        formData.append(key, String(value));
      });
      if (imageFile) formData.append("image", imageFile);

      let savedId = propertyId;
      if (isEdit) {
        await apiClient.patch(`/properties/${propertyId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const { data } = await apiClient.post<Property>("/properties/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        savedId = String(data.id);
      }

      // Documents are attached in a second step, since they need the
      // property's id which only exists after the property itself is saved.
      for (const doc of pendingDocs) {
        const docForm = new FormData();
        docForm.append("property", savedId!);
        docForm.append("name", doc.name);
        docForm.append("file", doc.file);
        await apiClient.post("/properties/documents/", docForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate(`/properties/${savedId}`);
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(
        typeof detail === "object" ? JSON.stringify(detail) : "Could not save property. Check the required fields."
      );
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
          { label: "Properties", to: "/properties" },
          { label: "Property Registration" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {isEdit ? "Edit Property" : "Property Registration"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/properties")}>
            Cancel
          </Button>
          <Button variant="outline" disabled={isSubmitting} onClick={() => handleSave("draft")}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save as Draft
          </Button>
          <Button variant="accent" disabled={isSubmitting} onClick={() => handleSave("active")}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save & Activate
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
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="details">Property Details</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Property Code" required>
                  <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="PROP-2024-0001" />
                </Field>
                <Field label="Property Name" required>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Property Type" required>
                  <Select value={form.property_type} onValueChange={(v) => set("property_type", v as Property["property_type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed_use">Mixed-use</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Property Category">
                  <Input value={form.property_category ?? ""} onChange={(e) => set("property_category", e.target.value)} placeholder="e.g. Office Building" />
                </Field>
                <Field label="Property Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as Property["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_construction">Under Construction</SelectItem>
                      <SelectItem value="fully_occupied">Fully Occupied</SelectItem>
                      <SelectItem value="partially_occupied">Partially Occupied</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Operational Status">
                  <Select value={form.operational_status} onValueChange={(v) => set("operational_status", v as Property["operational_status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="under_renovation">Under Renovation</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Year Built">
                  <Input type="number" value={form.year_built ?? ""} onChange={(e) => set("year_built", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Completion Date">
                  <Input type="date" value={form.completion_date ?? ""} onChange={(e) => set("completion_date", e.target.value)} />
                </Field>
              </div>
              <Field label="Description" className="mt-4">
                <Textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} maxLength={500} />
              </Field>
            </TabsContent>

            <TabsContent value="ownership">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Owner Name">
                  <Input value={form.owner_name ?? ""} onChange={(e) => set("owner_name", e.target.value)} />
                </Field>
                <Field label="Facility Manager">
                  <Input value={form.facility_manager ?? ""} onChange={(e) => set("facility_manager", e.target.value)} />
                </Field>
                <Field label="Maintenance Provider">
                  <Input value={form.maintenance_provider ?? ""} onChange={(e) => set("maintenance_provider", e.target.value)} />
                </Field>
                <Field label="Security Provider">
                  <Input value={form.security_provider ?? ""} onChange={(e) => set("security_provider", e.target.value)} />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Assigning a specific staff account as property manager (with app access) will be added once user management is built out.
              </p>
            </TabsContent>

            <TabsContent value="location">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Country">
                  <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} />
                </Field>
                <Field label="Region / State">
                  <Input value={form.region ?? ""} onChange={(e) => set("region", e.target.value)} />
                </Field>
                <Field label="City">
                  <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="Sub-City / District">
                  <Input value={form.sub_city ?? ""} onChange={(e) => set("sub_city", e.target.value)} />
                </Field>
                <Field label="Zone">
                  <Input value={form.zone ?? ""} onChange={(e) => set("zone", e.target.value)} />
                </Field>
                <Field label="Address">
                  <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Field label="GPS Latitude">
                  <Input value={form.gps_latitude ?? ""} onChange={(e) => set("gps_latitude", e.target.value)} />
                </Field>
                <Field label="GPS Longitude">
                  <Input value={form.gps_longitude ?? ""} onChange={(e) => set("gps_longitude", e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="details">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Total Land Area (sqm)">
                  <Input type="number" value={form.total_land_area_sqm ?? ""} onChange={(e) => set("total_land_area_sqm", e.target.value)} />
                </Field>
                <Field label="Gross Floor Area (sqm)">
                  <Input type="number" value={form.gross_floor_area_sqm ?? ""} onChange={(e) => set("gross_floor_area_sqm", e.target.value)} />
                </Field>
                <Field label="No. of Buildings">
                  <Input type="number" value={form.number_of_buildings ?? ""} onChange={(e) => set("number_of_buildings", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="No. of Floors">
                  <Input type="number" value={form.number_of_floors ?? ""} onChange={(e) => set("number_of_floors", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="No. of Units">
                  <Input type="number" value={form.number_of_units ?? ""} onChange={(e) => set("number_of_units", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Parking Capacity">
                  <Input type="number" value={form.parking_capacity ?? ""} onChange={(e) => set("parking_capacity", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Property Condition">
                  <Select value={form.property_condition || undefined} onValueChange={(v) => set("property_condition", v as Property["property_condition"])}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Energy Rating">
                  <Input value={form.energy_rating ?? ""} onChange={(e) => set("energy_rating", e.target.value)} placeholder="e.g. A" />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="financial">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Property Value (ETB)">
                  <Input type="number" value={form.property_value ?? ""} onChange={(e) => set("property_value", e.target.value)} />
                </Field>
                <Field label="Monthly Rental Income (ETB)">
                  <Input type="number" value={form.monthly_rental_income ?? ""} onChange={(e) => set("monthly_rental_income", e.target.value)} />
                </Field>
                <Field label="Annual Operating Cost (ETB)">
                  <Input type="number" value={form.annual_operating_cost ?? ""} onChange={(e) => set("annual_operating_cost", e.target.value)} />
                </Field>
                <Field label="Tax Registration Number">
                  <Input value={form.tax_registration_number ?? ""} onChange={(e) => set("tax_registration_number", e.target.value)} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <p className="text-sm text-muted-foreground mb-3">
                Upload supporting documents (title deed, insurance, permits). Files are attached once the property is saved.
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

            <TabsContent value="notes">
              <Field label="Internal Notes">
                <Textarea rows={6} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Property Image</h3>
            <div className="aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center mb-3">
              {imagePreview ? (
                <img src={imagePreview} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">No image</span>
              )}
            </div>
            <label className="w-full">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <span className="cursor-pointer">Upload image</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>
          </Card>

          {isEdit && form.created_by && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Audit Information</h3>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-tabular">{form.created_at ? new Date(form.created_at).toLocaleDateString() : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last updated</dt>
                  <dd className="font-tabular">{form.updated_at ? new Date(form.updated_at).toLocaleDateString() : "—"}</dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}
