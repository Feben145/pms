/**
 * Read-focused Rental Account detail page.
 *
 * This page is intentionally NOT tab-based.
 *
 * Tabs belong on the registration/edit page where the user is entering
 * or changing information.
 *
 * This page gives a complete read-only view of the rental account and
 * everything financially/contractually connected to it.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  Building2,
  User,
  Home,
  CalendarDays,
  CreditCard,
  Receipt,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { apiClient } from "../../api/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";


// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RentalAccount {
  id: number;
  rental_id_display: string;
  rental_account_number: string;

  lease: number;
  lease_number: string;

  tenant_id: number;
  tenant_name: string;

  unit_id: number;
  unit_number: string;

  property_id: number;
  property_name: string;

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

  outstanding_balance: string | number;

  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: number;
  invoice_number: string;

  invoice_date: string;

  rental_account: number;
  rental_account_number: string;

  lease_id: number;
  lease_number: string;

  tenant_id: number;
  tenant_name: string;

  unit_id: number;
  unit_number: string;

  property_id: number;
  property_name: string;

  billing_period_start: string;
  billing_period_end: string;
  due_date: string;

  base_rent: string | number;
  service_charge: string | number;
  parking_fee: string | number;
  utility_charges: string | number;
  internet_fee: string | number;
  other_charges: string | number;

  discount: string | number;
  tax_vat: string | number;

  late_payment_penalty: string | number;
  interest_amount: string | number;

  total_amount: string | number;

  status: string;

  amount_paid: string | number;
  outstanding_balance: string | number;

  gl_account: string;
  cost_center: string;
  financial_posting_status: string;

  created_at: string;
}

interface Payment {
  id: number;

  invoice: number;
  invoice_number: string;

  amount: string | number;
  method: string;
  paid_at: string;

  transaction_reference: string;
  receipt_number: string;
}

interface RentalAdjustment {
  id: number;

  rental_account: number;
  rental_account_number: string;

  adjustment_type: string;

  amount: string | number;
  percentage: string | number | null;

  effective_date: string;

  reason: string;

  created_at: string;
}

interface Deposit {
  id: number;

  rental_account: number;
  rental_account_number: string;

  security_deposit: string | number;
  deposit_balance: string | number;

  refund_status: string;

  refunded_amount: string | number;
  refund_date: string | null;

  created_at: string;
  updated_at: string;
}


// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return `ETB ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function date(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}

function capitalize(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function RentalDetailPage() {
  const { rentalId } = useParams();
  const navigate = useNavigate();

  const [rental, setRental] = useState<RentalAccount | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adjustments, setAdjustments] = useState<RentalAdjustment[]>([]);
  const [deposit, setDeposit] = useState<Deposit | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);


  // ---------------------------------------------------------------------------
  // Load rental account
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!rentalId) return;

    const loadRental = async () => {
      try {
        setIsLoading(true);
        setError("");

        const { data } = await apiClient.get<RentalAccount>(
          `/rentals/${rentalId}/`
        );

        setRental(data);
      } catch (err) {
        console.error("Failed to load rental account:", err);
        setError("Could not load rental account.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRental();
  }, [rentalId]);


  // ---------------------------------------------------------------------------
  // Load related financial records
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!rentalId) return;

    const loadRelatedData = async () => {
      try {
        const [
          invoicesResponse,
          paymentsResponse,
          adjustmentsResponse,
          depositResponse,
        ] = await Promise.all([
          apiClient.get<Invoice[]>(
            `/rentals/invoices/?rental_account=${rentalId}`
          ),

          apiClient.get<Payment[]>(
            `/rentals/payments/?invoice__rental_account=${rentalId}`
          ),

          apiClient.get<RentalAdjustment[]>(
            `/rentals/adjustments/?rental_account=${rentalId}`
          ),

          apiClient.get<Deposit[]>(
            `/rentals/deposits/?rental_account=${rentalId}`
          ),
        ]);

        setInvoices(
          Array.isArray(invoicesResponse.data)
            ? invoicesResponse.data
            : []
        );

        setPayments(
          Array.isArray(paymentsResponse.data)
            ? paymentsResponse.data
            : []
        );

        setAdjustments(
          Array.isArray(adjustmentsResponse.data)
            ? adjustmentsResponse.data
            : []
        );

        const deposits = Array.isArray(depositResponse.data)
          ? depositResponse.data
          : [];

        setDeposit(deposits.length > 0 ? deposits[0] : null);
      } catch (err) {
        console.error("Failed to load rental financial data:", err);
      }
    };

    loadRelatedData();
  }, [rentalId]);


  // ---------------------------------------------------------------------------
  // Download rental details
  // ---------------------------------------------------------------------------

  const handleDownload = () => {
    if (!rental) return;

    setIsDownloading(true);

    try {
      const lines: string[] = [];

      lines.push("RENTAL ACCOUNT DETAILS");
      lines.push("======================");
      lines.push("");

      lines.push("ACCOUNT INFORMATION");
      lines.push("-------------------");
      lines.push(`Rental ID: ${rental.rental_id_display}`);
      lines.push(`Account Number: ${rental.rental_account_number}`);
      lines.push(`Status: ${capitalize(rental.status)}`);
      lines.push(`Rent Type: ${capitalize(rental.rent_type)}`);
      lines.push(`Billing Frequency: ${capitalize(rental.billing_frequency)}`);
      lines.push("");

      lines.push("PROPERTY / UNIT");
      lines.push("----------------");
      lines.push(`Property: ${rental.property_name}`);
      lines.push(`Unit: ${rental.unit_number}`);
      lines.push("");

      lines.push("TENANT / LEASE");
      lines.push("--------------");
      lines.push(`Tenant: ${rental.tenant_name}`);
      lines.push(`Lease: ${rental.lease_number}`);
      lines.push("");

      lines.push("RENTAL CHARGES");
      lines.push("--------------");
      lines.push(`Rent: ${money(rental.rent_amount)}`);
      lines.push(`Service Charge: ${money(rental.service_charge)}`);
      lines.push(`Parking Fee: ${money(rental.parking_fee)}`);
      lines.push(`Utility Charge: ${money(rental.utility_charge)}`);
      lines.push(`Internet Fee: ${money(rental.internet_fee)}`);
      lines.push(`Other Charge: ${money(rental.other_charge)}`);
      lines.push(`Default Discount: ${money(rental.default_discount)}`);
      lines.push("");

      lines.push("ESCALATION");
      lines.push("----------");
      lines.push(
        `Escalation Applied: ${
          rental.rent_escalation_applied ? "Yes" : "No"
        }`
      );
      lines.push(
        `Escalation Percentage: ${
          rental.escalation_percentage ?? "—"
        }`
      );
      lines.push("");

      lines.push("LATE PAYMENT");
      lines.push("------------");
      lines.push(
        `Grace Period: ${rental.grace_period_days} days`
      );
      lines.push(
        `Penalty: ${rental.late_payment_penalty_percent}%`
      );
      lines.push(
        `Interest Rate: ${rental.late_interest_rate}%`
      );
      lines.push("");

      lines.push("ACCOUNTING");
      lines.push("----------");
      lines.push(`GL Account: ${rental.gl_account || "—"}`);
      lines.push(`Cost Center: ${rental.cost_center || "—"}`);
      lines.push(
        `Posting Status: ${capitalize(
          rental.financial_posting_status
        )}`
      );
      lines.push("");

      lines.push("OUTSTANDING BALANCE");
      lines.push("-------------------");
      lines.push(money(rental.outstanding_balance));
      lines.push("");

      if (deposit) {
        lines.push("SECURITY DEPOSIT");
        lines.push("----------------");
        lines.push(
          `Security Deposit: ${money(deposit.security_deposit)}`
        );
        lines.push(
          `Deposit Balance: ${money(deposit.deposit_balance)}`
        );
        lines.push(
          `Refund Status: ${capitalize(deposit.refund_status)}`
        );
        lines.push(
          `Refunded Amount: ${money(deposit.refunded_amount)}`
        );
        lines.push(
          `Refund Date: ${date(deposit.refund_date)}`
        );
        lines.push("");
      }

      lines.push("INVOICES");
      lines.push("--------");

      if (invoices.length === 0) {
        lines.push("No invoices.");
      } else {
        invoices.forEach((invoice) => {
          lines.push(
            `${invoice.invoice_number} | ` +
            `${date(invoice.billing_period_start)} - ${date(
              invoice.billing_period_end
            )} | ` +
            `${money(invoice.total_amount)} | ` +
            `Paid ${money(invoice.amount_paid)} | ` +
            `Outstanding ${money(invoice.outstanding_balance)} | ` +
            `${capitalize(invoice.status)}`
          );
        });
      }

      lines.push("");

      lines.push("PAYMENTS");
      lines.push("--------");

      if (payments.length === 0) {
        lines.push("No payments.");
      } else {
        payments.forEach((payment) => {
          lines.push(
            `${payment.invoice_number} | ` +
            `${date(payment.paid_at)} | ` +
            `${money(payment.amount)} | ` +
            `${capitalize(payment.method)} | ` +
            `${payment.receipt_number || "No receipt"}`
          );
        });
      }

      lines.push("");

      lines.push("ADJUSTMENTS");
      lines.push("-----------");

      if (adjustments.length === 0) {
        lines.push("No adjustments.");
      } else {
        adjustments.forEach((adjustment) => {
          lines.push(
            `${capitalize(adjustment.adjustment_type)} | ` +
            `${money(adjustment.amount)} | ` +
            `${date(adjustment.effective_date)} | ` +
            `${adjustment.reason || "No reason"}`
          );
        });
      }

      lines.push("");

      lines.push("AUDIT");
      lines.push("-----");
      lines.push(`Created: ${date(rental.created_at)}`);
      lines.push(`Last Updated: ${date(rental.updated_at)}`);

      const content = lines.join("\n");

      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      link.download =
        `${rental.rental_account_number || "rental-account"}-details.txt`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };


  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading rental account...
      </div>
    );
  }


  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------

  if (error || !rental) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-danger">
          {error || "Rental account not found."}
        </p>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/rentals")}
        >
          Back to Rentals
        </Button>
      </div>
    );
  }


  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  const outstanding = Number(rental.outstanding_balance);

  const totalMonthlyCharges =
    Number(rental.rent_amount || 0) +
    Number(rental.service_charge || 0) +
    Number(rental.parking_fee || 0) +
    Number(rental.utility_charge || 0) +
    Number(rental.internet_fee || 0) +
    Number(rental.other_charge || 0) -
    Number(rental.default_discount || 0);


  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------ */}
      {/* Breadcrumb */}
      {/* ------------------------------------------------------------------ */}

      <Breadcrumb
        items={[
          { label: "Rental Management" },
          { label: "Rental Accounts", to: "/rentals" },
          {
            label:
              rental.rental_account_number ||
              rental.rental_id_display,
          },
        ]}
      />


      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">

            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {rental.rental_account_number}
            </h1>

            <StatusBadge status={rental.status} />

          </div>

          <p className="text-sm text-muted-foreground font-tabular">
            {rental.rental_id_display}
            {" · "}
            {capitalize(rental.rent_type)}
            {" · "}
            {capitalize(rental.billing_frequency)}
          </p>
        </div>


        <div className="flex flex-wrap gap-2">

          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />

            {isDownloading
              ? "Preparing..."
              : "Download"}
          </Button>

          <Button
            variant="accent"
            onClick={() =>
              navigate(`/rentals/${rental.id}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Rental
          </Button>

        </div>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Summary cards */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard
          icon={Wallet}
          label="Monthly Charges"
          value={money(totalMonthlyCharges)}
        />

        <StatCard
          icon={AlertCircle}
          label="Outstanding"
          value={money(outstanding)}
          danger={outstanding > 0}
        />

        <StatCard
          icon={Receipt}
          label="Invoices"
          value={String(invoices.length)}
        />

        <StatCard
          icon={CreditCard}
          label="Payments"
          value={String(payments.length)}
        />

      </div>


      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ================================================================= */}
        {/* MAIN CONTENT */}
        {/* ================================================================= */}

        <div className="space-y-6">


          {/* ---------------------------------------------------------------- */}
          {/* Rental Account */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle>Rental Account</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">

              <InfoRow
                label="Rental Account Number"
                value={rental.rental_account_number}
              />

              <InfoRow
                label="Rental Type"
                value={capitalize(rental.rent_type)}
              />

              <InfoRow
                label="Billing Frequency"
                value={capitalize(rental.billing_frequency)}
              />

              <InfoRow
                label="Status"
                value={capitalize(rental.status)}
              />

              <InfoRow
                label="Lease"
                value={rental.lease_number}
                clickable
                onClick={() =>
                  navigate(`/leases/${rental.lease}`)
                }
              />

              <InfoRow
                label="Tenant"
                value={rental.tenant_name}
              />

            </CardContent>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Property / Unit */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Property & Unit
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">

              <InfoRow
                label="Property"
                value={rental.property_name}
              />

              <InfoRow
                label="Unit"
                value={rental.unit_number}
              />

              <InfoRow
                label="Tenant"
                value={rental.tenant_name}
              />

              <InfoRow
                label="Lease Number"
                value={rental.lease_number}
              />

            </CardContent>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Charges */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle>Rental Charges</CardTitle>
            </CardHeader>

            <CardContent>

              <div className="divide-y divide-border">

                <AmountRow
                  label="Base Rent"
                  value={rental.rent_amount}
                />

                <AmountRow
                  label="Service Charge"
                  value={rental.service_charge}
                />

                <AmountRow
                  label="Parking Fee"
                  value={rental.parking_fee}
                />

                <AmountRow
                  label="Utility Charge"
                  value={rental.utility_charge}
                />

                <AmountRow
                  label="Internet Fee"
                  value={rental.internet_fee}
                />

                <AmountRow
                  label="Other Charge"
                  value={rental.other_charge}
                />

                <AmountRow
                  label="Default Discount"
                  value={rental.default_discount}
                  negative
                />

                <div className="flex items-center justify-between py-3 font-semibold">

                  <span>Total Monthly Charges</span>

                  <span className="font-tabular">
                    {money(totalMonthlyCharges)}
                  </span>

                </div>

              </div>

            </CardContent>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Escalation / Late Payment */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <Card>

              <CardHeader>
                <CardTitle>Rent Escalation</CardTitle>
              </CardHeader>

              <CardContent className="text-sm space-y-3">

                <InfoRow
                  label="Escalation Applied"
                  value={
                    rental.rent_escalation_applied
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoRow
                  label="Escalation Percentage"
                  value={
                    rental.escalation_percentage != null
                      ? `${rental.escalation_percentage}%`
                      : "—"
                  }
                />

              </CardContent>

            </Card>


            <Card>

              <CardHeader>
                <CardTitle>Late Payment</CardTitle>
              </CardHeader>

              <CardContent className="text-sm space-y-3">

                <InfoRow
                  label="Grace Period"
                  value={`${rental.grace_period_days} days`}
                />

                <InfoRow
                  label="Penalty"
                  value={`${rental.late_payment_penalty_percent}%`}
                />

                <InfoRow
                  label="Interest Rate"
                  value={`${rental.late_interest_rate}%`}
                />

              </CardContent>

            </Card>

          </div>


          {/* ---------------------------------------------------------------- */}
          {/* Deposit */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle>Security Deposit</CardTitle>
            </CardHeader>

            <CardContent>

              {!deposit ? (
                <p className="text-sm text-muted-foreground py-3">
                  No security deposit record.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">

                  <InfoRow
                    label="Security Deposit"
                    value={money(deposit.security_deposit)}
                  />

                  <InfoRow
                    label="Deposit Balance"
                    value={money(deposit.deposit_balance)}
                  />

                  <InfoRow
                    label="Refund Status"
                    value={capitalize(deposit.refund_status)}
                  />

                  <InfoRow
                    label="Refunded Amount"
                    value={money(deposit.refunded_amount)}
                  />

                  <InfoRow
                    label="Refund Date"
                    value={date(deposit.refund_date)}
                  />

                </div>
              )}

            </CardContent>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Invoices */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>

            <CardContent>

              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No invoices generated for this rental account.
                </p>
              ) : (
                <div className="overflow-x-auto">

                  <Table>

                    <TableHeader>

                      <TableRow className="hover:bg-transparent">

                        <TableHead>Invoice #</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">
                          Total
                        </TableHead>
                        <TableHead className="text-right">
                          Paid
                        </TableHead>
                        <TableHead className="text-right">
                          Outstanding
                        </TableHead>
                        <TableHead>Status</TableHead>

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      {invoices.map((invoice) => (

                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/rentals/invoices/${invoice.id}`
                            )
                          }
                        >

                          <TableCell className="font-medium font-tabular">
                            {invoice.invoice_number}
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {date(invoice.billing_period_start)}
                            {" → "}
                            {date(invoice.billing_period_end)}
                          </TableCell>

                          <TableCell>
                            {date(invoice.due_date)}
                          </TableCell>

                          <TableCell className="text-right font-tabular">
                            {money(invoice.total_amount)}
                          </TableCell>

                          <TableCell className="text-right font-tabular">
                            {money(invoice.amount_paid)}
                          </TableCell>

                          <TableCell className="text-right font-tabular">
                            {money(invoice.outstanding_balance)}
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>

                        </TableRow>

                      ))}

                    </TableBody>

                  </Table>

                </div>
              )}

            </CardContent>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Payments */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>

            <CardContent>

              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No payments recorded.
                </p>
              ) : (
                <Table>

                  <TableHeader>

                    <TableRow className="hover:bg-transparent">

                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">
                        Amount
                      </TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {payments.map((payment) => (

                      <TableRow key={payment.id}>

                        <TableCell className="font-medium">
                          {payment.invoice_number}
                        </TableCell>

                        <TableCell>
                          {date(payment.paid_at)}
                        </TableCell>

                        <TableCell>
                          {capitalize(payment.method)}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {payment.transaction_reference || "—"}
                        </TableCell>

                        <TableCell className="text-right font-tabular">
                          {money(payment.amount)}
                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                </Table>
              )}

            </CardContent>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Adjustments */}
          {/* ---------------------------------------------------------------- */}

          <Card>

            <CardHeader>
              <CardTitle>Rental Adjustments</CardTitle>
            </CardHeader>

            <CardContent>

              {adjustments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No rental adjustments.
                </p>
              ) : (
                <Table>

                  <TableHeader>

                    <TableRow className="hover:bg-transparent">

                      <TableHead>Type</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Reason</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {adjustments.map((adjustment) => (

                      <TableRow key={adjustment.id}>

                        <TableCell>
                          {capitalize(adjustment.adjustment_type)}
                        </TableCell>

                        <TableCell>
                          {date(adjustment.effective_date)}
                        </TableCell>

                        <TableCell className="font-tabular">
                          {money(adjustment.amount)}
                        </TableCell>

                        <TableCell>
                          {adjustment.percentage != null
                            ? `${adjustment.percentage}%`
                            : "—"}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {adjustment.reason || "—"}
                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                </Table>
              )}

            </CardContent>

          </Card>

        </div>


        {/* ================================================================= */}
        {/* RIGHT SIDEBAR */}
        {/* ================================================================= */}

        <div className="space-y-4">


          {/* ---------------------------------------------------------------- */}
          {/* Tenant */}
          {/* ---------------------------------------------------------------- */}

          <Card className="p-4">

            <div className="flex items-center gap-2 mb-4">

              <User className="h-4 w-4 text-muted-foreground" />

              <h3 className="text-sm font-medium">
                Tenant
              </h3>

            </div>

            <dl className="text-xs space-y-3">

              <InfoRow
                label="Name"
                value={rental.tenant_name}
              />

              <InfoRow
                label="Tenant ID"
                value={String(rental.tenant_id)}
              />

            </dl>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Lease */}
          {/* ---------------------------------------------------------------- */}

          <Card className="p-4">

            <div className="flex items-center gap-2 mb-4">

              <Home className="h-4 w-4 text-muted-foreground" />

              <h3 className="text-sm font-medium">
                Lease
              </h3>

            </div>

            <dl className="text-xs space-y-3">

              <InfoRow
                label="Lease Number"
                value={rental.lease_number}
                clickable
                onClick={() =>
                  navigate(`/leases/${rental.lease}`)
                }
              />

              <InfoRow
                label="Property"
                value={rental.property_name}
              />

              <InfoRow
                label="Unit"
                value={rental.unit_number}
              />

            </dl>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Accounting */}
          {/* ---------------------------------------------------------------- */}

          <Card className="p-4">

            <h3 className="text-sm font-medium mb-4">
              Accounting
            </h3>

            <dl className="text-xs space-y-3">

              <InfoRow
                label="GL Account"
                value={rental.gl_account || "—"}
              />

              <InfoRow
                label="Cost Center"
                value={rental.cost_center || "—"}
              />

              <InfoRow
                label="Posting Status"
                value={capitalize(
                  rental.financial_posting_status
                )}
              />

            </dl>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Audit */}
          {/* ---------------------------------------------------------------- */}

          <Card className="p-4">

            <div className="flex items-center gap-2 mb-4">

              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <h3 className="text-sm font-medium">
                Audit Information
              </h3>

            </div>

            <dl className="text-xs space-y-3">

              <InfoRow
                label="Created"
                value={date(rental.created_at)}
              />

              <InfoRow
                label="Last Updated"
                value={date(rental.updated_at)}
              />

            </dl>

          </Card>


          {/* ---------------------------------------------------------------- */}
          {/* Balance */}
          {/* ---------------------------------------------------------------- */}

          <Card className="p-4">

            <h3 className="text-sm font-medium mb-3">
              Account Balance
            </h3>

            <p
              className={`text-xl font-semibold font-tabular ${
                outstanding > 0
                  ? "text-danger"
                  : "text-foreground"
              }`}
            >
              {money(rental.outstanding_balance)}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Current outstanding balance
            </p>

          </Card>

        </div>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Bottom action bar */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-between border-t border-border pt-5">

        <Button
          variant="outline"
          onClick={() => navigate("/rentals")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rental Accounts
        </Button>

        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />

          {isDownloading
            ? "Preparing..."
            : "Download Rental Details"}
        </Button>

      </div>

    </div>
  );
}


// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Card className="p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <Icon className="h-4 w-4 text-muted-foreground" />

      </div>

      <p
        className={`text-lg font-semibold mt-2 font-tabular ${
          danger ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </p>

    </Card>
  );
}


function InfoRow({
  label,
  value,
  clickable,
  onClick,
}: {
  label: string;
  value: string;
  clickable?: boolean;
  onClick?: () => void;
}) {
  return (
    <div>

      <p className="text-xs text-muted-foreground mb-1">
        {label}
      </p>

      {clickable ? (
        <button
          type="button"
          onClick={onClick}
          className="text-foreground hover:text-accent hover:underline text-left"
        >
          {value}
        </button>
      ) : (
        <p className="text-foreground">
          {value}
        </p>
      )}

    </div>
  );
}


function AmountRow({
  label,
  value,
  negative,
}: {
  label: string;
  value: string | number | null | undefined;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">

      <span className="text-muted-foreground">
        {label}
      </span>

      <span
        className={`font-tabular ${
          negative ? "text-danger" : "text-foreground"
        }`}
      >
        {negative && Number(value || 0) > 0 ? "- " : ""}
        {money(value)}
      </span>

    </div>
  );
}