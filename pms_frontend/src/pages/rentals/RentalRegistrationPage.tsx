import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  Save,
} from "lucide-react";

import { apiClient } from "../../api/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { Breadcrumb } from "../../components/Breadcrumb";

interface Lease {
  id: number;
  lease_number: string;
  tenant_name?: string;
  unit_number?: string;
  property_name?: string;
  status?: string;
  monthly_rent?: string | number;
  service_charge?: string | number;
  parking_fee?: string | number;
  security_deposit?: string | number;
  billing_frequency?: string;
}

interface RentalAccount {
  id: number;
  rental_account_number: string;
  lease: number;
  rent_type: string;
  status: string;
  billing_frequency: string;

  rent_amount: string | number;
  service_charge: string | number;
  parking_fee: string | number;
  utility_charge: string | number;
  internet_fee: string | number;
  other_charge: string | number;

  default_discount: string | number;
  rent_escalation_applied: boolean;
  escalation_percentage: string | number | null;

  grace_period_days: number;
  late_payment_penalty_percent: string | number;
  late_interest_rate: string | number;

  gl_account: string;
  cost_center: string;
  financial_posting_status: string;
}

type FormState = Partial<RentalAccount>;

const EMPTY_FORM: FormState = {
  rent_type: "residential",
  status: "active",
  billing_frequency: "monthly",

  rent_amount: 0,
  service_charge: 0,
  parking_fee: 0,
  utility_charge: 0,
  internet_fee: 0,
  other_charge: 0,

  default_discount: 0,
  rent_escalation_applied: false,
  escalation_percentage: null,

  grace_period_days: 0,
  late_payment_penalty_percent: 0,
  late_interest_rate: 0,

  gl_account: "",
  cost_center: "",
  financial_posting_status: "not_posted",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && (
          <span className="text-danger ml-1">*</span>
        )}
      </Label>

      {children}
    </div>
  );
}

function ReadOnlyStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-semibold text-foreground mt-0.5">
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function RentalRegistrationPage() {
  const { rentalId } = useParams();
  const navigate = useNavigate();

  const isEdit = !!rentalId;

  const [form, setForm] = useState<FormState>(
    EMPTY_FORM
  );

  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLease, setSelectedLease] =
    useState<Lease | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [loadingLeases, setLoadingLeases] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function set<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  useEffect(() => {
    loadLeases();

    if (isEdit) {
      loadRental();
    }
  }, [rentalId]);

  async function loadLeases() {
    setLoadingLeases(true);

    try {
      const { data } = await apiClient.get(
        "/leases/",
        {
          params: {
            status: "active",
          },
        }
      );

      const items = Array.isArray(data)
        ? data
        : data.results ?? [];

      setLeases(items);
    } catch {
      setError("Could not load leases.");
    } finally {
      setLoadingLeases(false);
    }
  }

  async function loadRental() {
    try {
      const { data } =
        await apiClient.get<RentalAccount>(
          `/rentals/${rentalId}/`
        );

      setForm(data);

      if (data.lease) {
        try {
          const leaseResponse =
            await apiClient.get<Lease>(
              `/leases/${data.lease}/`
            );

          setSelectedLease(
            leaseResponse.data
          );
        } catch {
          setSelectedLease(null);
        }
      }
    } catch {
      setError("Could not load rental account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaseChange(
    leaseId: string
  ) {
    const id = Number(leaseId);

    set("lease", id);

    try {
      const { data } =
        await apiClient.get<Lease>(
          `/leases/${id}/`
        );

      setSelectedLease(data);

      /*
       * Populate financial defaults from the Lease.
       *
       * These remain editable because RentalAccount
       * represents the financial account configuration.
       */
      setForm((current) => ({
        ...current,
        lease: id,

        rent_amount:
          data.monthly_rent ??
          current.rent_amount ??
          0,

        service_charge:
          data.service_charge ??
          current.service_charge ??
          0,

        parking_fee:
          data.parking_fee ??
          current.parking_fee ??
          0,

        billing_frequency:
          data.billing_frequency ??
          current.billing_frequency ??
          "monthly",
      }));
    } catch {
      setSelectedLease(null);
    }
  }

  async function handleSave() {
    if (!form.lease) {
      setError("Select a lease.");
      return;
    }

    if (!form.rental_account_number) {
      setError("Enter a rental account number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
      };

      if (isEdit) {
        await apiClient.patch(
          `/rentals/${rentalId}/`,
          payload
        );
      } else {
        await apiClient.post(
          "/rentals/",
          payload
        );
      }

      navigate("/rentals");
    } catch (err: any) {
      const detail =
        err?.response?.data;

      setError(
        typeof detail === "object"
          ? JSON.stringify(detail)
          : "Could not save rental account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading rental account...
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Rental Management",
          },
          {
            label: "Rentals",
            to: "/rentals",
          },
          {
            label: isEdit ? "Edit" : "New",
          },
        ]}
      />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isEdit
              ? "Edit Rental Account"
              : "Rental Registration"}
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Configure the financial rental account associated
            with a lease.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/rentals")}
          >
            Cancel
          </Button>

          <Button
            variant="accent"
            disabled={submitting}
            onClick={handleSave}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Save Rental
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-danger/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Card className="p-5">
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">
              Rental Account
            </TabsTrigger>

            <TabsTrigger value="lease">
              Lease & Property
            </TabsTrigger>

            <TabsTrigger value="charges">
              Charges
            </TabsTrigger>

            <TabsTrigger value="discount">
              Discount & Escalation
            </TabsTrigger>

            <TabsTrigger value="penalty">
              Late Payment
            </TabsTrigger>

            <TabsTrigger value="accounting">
              Accounting
            </TabsTrigger>
          </TabsList>

          {/* ACCOUNT */}

          <TabsContent value="account">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Rental Account Number"
                required
              >
                <Input
                  value={
                    form.rental_account_number ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "rental_account_number",
                      e.target.value
                    )
                  }
                  placeholder="RA-2026-001"
                />
              </Field>

              <Field label="Rent Type" required>
                <Select
                  value={
                    form.rent_type ?? "residential"
                  }
                  onValueChange={(value) =>
                    set("rent_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="residential">
                      Residential
                    </SelectItem>

                    <SelectItem value="commercial">
                      Commercial
                    </SelectItem>

                    <SelectItem value="parking">
                      Parking
                    </SelectItem>

                    <SelectItem value="storage">
                      Storage
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status">
                <Select
                  value={
                    form.status ?? "active"
                  }
                  onValueChange={(value) =>
                    set("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">
                      Active
                    </SelectItem>

                    <SelectItem value="suspended">
                      Suspended
                    </SelectItem>

                    <SelectItem value="closed">
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Billing Frequency">
                <Select
                  value={
                    form.billing_frequency ??
                    "monthly"
                  }
                  onValueChange={(value) =>
                    set(
                      "billing_frequency",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="monthly">
                      Monthly
                    </SelectItem>

                    <SelectItem value="quarterly">
                      Quarterly
                    </SelectItem>

                    <SelectItem value="annually">
                      Annually
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </TabsContent>

          {/* LEASE */}

          <TabsContent value="lease">
            <Field
              label="Lease"
              required
            >
              <Select
                value={
                  form.lease
                    ? String(form.lease)
                    : undefined
                }
                onValueChange={
                  handleLeaseChange
                }
                disabled={isEdit || loadingLeases}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingLeases
                        ? "Loading leases..."
                        : "Select a lease..."
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem
                      key={lease.id}
                      value={String(lease.id)}
                    >
                      {lease.lease_number}
                      {lease.tenant_name
                        ? ` — ${lease.tenant_name}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {selectedLease && (
              <div className="grid grid-cols-3 gap-5 mt-6 pt-5 border-t border-border">
                <ReadOnlyStat
                  label="Lease"
                  value={
                    selectedLease.lease_number
                  }
                />

                <ReadOnlyStat
                  label="Tenant"
                  value={
                    selectedLease.tenant_name
                  }
                />

                <ReadOnlyStat
                  label="Property"
                  value={
                    selectedLease.property_name
                  }
                />

                <ReadOnlyStat
                  label="Unit"
                  value={
                    selectedLease.unit_number
                  }
                />

                <ReadOnlyStat
                  label="Lease Status"
                  value={
                    selectedLease.status
                  }
                />

                <ReadOnlyStat
                  label="Lease Rent"
                  value={
                    selectedLease.monthly_rent
                      ? `ETB ${Number(
                          selectedLease.monthly_rent
                        ).toLocaleString()}`
                      : "—"
                  }
                />
              </div>
            )}
          </TabsContent>

          {/* CHARGES */}

          <TabsContent value="charges">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rent Amount">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.rent_amount ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "rent_amount",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <Field label="Service Charge">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.service_charge ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "service_charge",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <Field label="Parking Fee">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.parking_fee ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "parking_fee",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <Field label="Utility Charge">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.utility_charge ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "utility_charge",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <Field label="Internet Fee">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.internet_fee ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "internet_fee",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <Field label="Other Charge">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.other_charge ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "other_charge",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>
            </div>
          </TabsContent>

          {/* DISCOUNT */}

          <TabsContent value="discount">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Default Discount">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.default_discount ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "default_discount",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <div className="flex items-center justify-between border border-border rounded-md px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    Rent Escalation Applied
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Apply escalation to this account.
                  </p>
                </div>

                <Switch
                  checked={
                    !!form.rent_escalation_applied
                  }
                  onCheckedChange={(value) =>
                    set(
                      "rent_escalation_applied",
                      value
                    )
                  }
                />
              </div>

              <Field label="Escalation Percentage">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.escalation_percentage ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "escalation_percentage",
                      e.target.value
                        ? Number(e.target.value)
                        : null
                    )
                  }
                />
              </Field>
            </div>
          </TabsContent>

          {/* PENALTY */}

          <TabsContent value="penalty">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Grace Period (days)">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.grace_period_days ?? 0
                  }
                  onChange={(e) =>
                    set(
                      "grace_period_days",
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Late Payment Penalty (%)">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.late_payment_penalty_percent ??
                    0
                  }
                  onChange={(e) =>
                    set(
                      "late_payment_penalty_percent",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>

              <Field label="Late Interest Rate (%)">
                <Input
                  type="number"
                  min="0"
                  value={
                    form.late_interest_rate ?? 0
                  }
                  onChange={(e) =>
                    set(
                      "late_interest_rate",
                      e.target.value
                        ? Number(e.target.value)
                        : 0
                    )
                  }
                />
              </Field>
            </div>
          </TabsContent>

          {/* ACCOUNTING */}

          <TabsContent value="accounting">
            <div className="grid grid-cols-2 gap-4">
              <Field label="GL Account">
                <Input
                  value={
                    form.gl_account ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "gl_account",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Cost Center">
                <Input
                  value={
                    form.cost_center ?? ""
                  }
                  onChange={(e) =>
                    set(
                      "cost_center",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Financial Posting Status">
                <Input
                  value={
                    form.financial_posting_status ??
                    "not_posted"
                  }
                  onChange={(e) =>
                    set(
                      "financial_posting_status",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}