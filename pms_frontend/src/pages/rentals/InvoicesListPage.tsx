import { useState } from "react";
import { useCollection } from "../../hooks/useCollection";
import type { Invoice, Lease, Payment } from "../../types/models";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumb } from "../../components/Breadcrumb";
import { DataTable } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "../../api/client";
import { Plus } from "lucide-react";

export default function InvoicesListPage() {
  const { items, isLoading, error, refetch, create } = useCollection<Invoice>("/rentals/");
  const { items: leases } = useCollection<Lease>("/leases/");
  const [showCreate, setShowCreate] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  const leaseLabel = (id: number) => leases.find((l) => l.id === id)?.lease_number ?? `#${id}`;

  return (
    <div>
      <Breadcrumb items={[{ label: "Rental Management" }, { label: "Rent Invoice" }]} />
      <PageHeader
        title="Invoices"
        description="Rent billing and payment history"
        action={
          <Button variant="accent" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        }
      />

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <DataTable<Invoice>
        isLoading={isLoading}
        rows={items}
        emptyMessage="No invoices yet."
        columns={[
          { header: "Invoice #", render: (i) => <span className="font-medium font-tabular">{i.invoice_number}</span> },
          { header: "Lease", render: (i) => leaseLabel(i.lease) },
          { header: "Due", render: (i) => <span className="text-muted-foreground">{i.due_date}</span> },
          { header: "Total", render: (i) => <span className="font-tabular">ETB {Number(i.total_amount).toLocaleString()}</span> },
          { header: "Outstanding", render: (i) => <span className="font-tabular">ETB {Number(i.outstanding_balance).toLocaleString()}</span> },
          { header: "Status", render: (i) => <StatusBadge status={i.status} /> },
          {
            header: "",
            render: (i) =>
              i.status !== "paid" && i.status !== "cancelled" ? (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPayInvoice(i);
                  }}
                >
                  Record payment
                </Button>
              ) : null,
          },
        ]}
      />

      <CreateInvoiceDialog open={showCreate} onOpenChange={setShowCreate} onCreate={create} leases={leases} />

      {payInvoice && (
        <RecordPaymentDialog
          invoice={payInvoice}
          onOpenChange={(open) => !open && setPayInvoice(null)}
          onRecorded={refetch}
        />
      )}
    </div>
  );
}

function CreateInvoiceDialog({
  open,
  onOpenChange,
  onCreate,
  leases,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: Partial<Invoice>) => Promise<Invoice>;
  leases: Lease[];
}) {
  const [form, setForm] = useState<Partial<Invoice>>({ status: "issued", service_charge: "0", other_charges: "0" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const base = Number(form.base_rent ?? 0);
      const service = Number(form.service_charge ?? 0);
      const other = Number(form.other_charges ?? 0);
      await onCreate({ ...form, total_amount: String(base + service + other) });
      onOpenChange(false);
    } catch {
      setError("Could not create invoice. Check the required fields.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}

          <div><Label>Invoice number</Label><Input required placeholder="e.g. INV-2026-1001" onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>

          <div>
            <Label>Lease</Label>
            <Select onValueChange={(v) => setForm({ ...form, lease: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Select a lease..." /></SelectTrigger>
              <SelectContent>
                {leases.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.lease_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>Period start</Label><Input type="date" required onChange={(e) => setForm({ ...form, billing_period_start: e.target.value })} /></div>
            <div><Label>Period end</Label><Input type="date" required onChange={(e) => setForm({ ...form, billing_period_end: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" required onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>

          <div><Label>Base rent (ETB)</Label><Input type="number" required onChange={(e) => setForm({ ...form, base_rent: e.target.value })} /></div>
          <div><Label>Service charge (ETB)</Label><Input type="number" onChange={(e) => setForm({ ...form, service_charge: e.target.value })} /></div>
          <div><Label>Other charges (ETB)</Label><Input type="number" onChange={(e) => setForm({ ...form, other_charges: e.target.value })} /></div>

          <Button type="submit" variant="accent" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentDialog({
  invoice,
  onOpenChange,
  onRecorded,
}: {
  invoice: Invoice;
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}) {
  const [amount, setAmount] = useState(invoice.outstanding_balance);
  const [method, setMethod] = useState<Payment["method"]>("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/rentals/payments/", {
        invoice: invoice.id,
        amount,
        method,
        paid_at: new Date().toISOString(),
      });
      onRecorded();
      onOpenChange(false);
    } catch {
      setError("Could not record payment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment — {invoice.invoice_number}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <p className="text-sm text-muted-foreground">
            Outstanding balance:{" "}
            <span className="font-medium text-foreground font-tabular">
              ETB {Number(invoice.outstanding_balance).toLocaleString()}
            </span>
          </p>

          <div>
            <Label>Amount (ETB)</Label>
            <Input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div>
            <Label>Payment method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as Payment["method"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" variant="accent" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
