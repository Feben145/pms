/**
 * RentalDetailPage
 *
 * Read-focused one-page rental account record.
 *
 * This page is intended for:
 * - reviewing the rental account
 * - viewing lease / tenant / property context
 * - viewing rental charges
 * - viewing invoices
 * - viewing payments
 * - viewing adjustments
 * - viewing deposit information
 * - viewing accounting information
 * - printing
 * - saving the rental record as PDF
 *
 * Editing remains on a separate page.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
} from "lucide-react";

import { apiClient } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";

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


/* ================================================================
   LOCAL TYPES
================================================================ */

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

  rent_amount: number | string;
  service_charge: number | string;
  parking_fee: number | string;
  utility_charge: number | string;
  internet_fee: number | string;
  other_charge: number | string;

  default_discount: number | string;
  rent_escalation_applied: boolean;
  escalation_percentage: number | string;

  grace_period_days: number;
  late_payment_penalty_percent: number | string;
  late_interest_rate: number | string;

  gl_account: string;
  cost_center: string;
  financial_posting_status: string;

  outstanding_balance: number | string;

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

  base_rent: number | string;
  service_charge: number | string;
  parking_fee: number | string;
  utility_charges: number | string;
  internet_fee: number | string;
  other_charges: number | string;
  discount: number | string;
  tax_vat: number | string;
  late_payment_penalty: number | string;
  interest_amount: number | string;
  total_amount: number | string;

  status: string;

  amount_paid: number | string;
  outstanding_balance: number | string;

  payments?: Payment[];

  gl_account: string;
  cost_center: string;
  financial_posting_status: string;

  created_at: string;
}

interface Payment {
  id: number;
  invoice: number;
  invoice_number: string;

  amount: number | string;
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
  amount: number | string;
  percentage: number | string;

  effective_date: string;
  reason: string;

  created_at: string;
}

interface Deposit {
  id: number;

  rental_account: number;
  rental_account_number: string;

  security_deposit: number | string;
  deposit_balance: number | string;

  refund_status: string;
  refunded_amount: number | string;
  refund_date: string | null;

  created_at: string;
  updated_at: string;
}


/* ================================================================
   PAGE
================================================================ */

export default function RentalDetailPage() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const navigate = useNavigate();

  const [rental, setRental] =
    useState<RentalAccount | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /*
   * IMPORTANT:
   *
   * Invoices are under /rentals/invoices/
   * NOT /rentals/
   */
  const {
    items: invoices,
    isLoading: invoicesLoading,
  } = useCollection<Invoice>(
    "/rentals/invoices/",
    rentalId
      ? {
          rental_account: rentalId,
        }
      : {}
  );

  const {
    items: adjustments,
    isLoading: adjustmentsLoading,
  } = useCollection<RentalAdjustment>(
    "/rentals/adjustments/",
    rentalId
      ? {
          rental_account: rentalId,
        }
      : {}
  );

  const {
    items: deposits,
    isLoading: depositsLoading,
  } = useCollection<Deposit>(
    "/rentals/deposits/",
    rentalId
      ? {
          rental_account: rentalId,
        }
      : {}
  );


  /* ================================================================
     LOAD RENTAL
  ================================================================ */

  useEffect(() => {
    if (rentalId) {
      loadRental();
    }
  }, [rentalId]);


  async function loadRental() {
    if (!rentalId) return;

    try {
      setIsLoading(true);

      const { data } =
        await apiClient.get<RentalAccount>(
          `/rentals/${rentalId}/`
        );

      setRental(data);
    } catch (error) {
      console.error(
        "Failed to load rental account:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }


  /* ================================================================
     PRINT / PDF
  ================================================================ */

  function handlePrint() {
    window.print();
  }


  function handleDownloadPdf() {
    /*
     * Browser-native PDF generation.
     *
     * This opens the browser print dialog.
     * User selects:
     *
     * Destination → Save as PDF
     */

    window.print();
  }


  /* ================================================================
     LOADING
  ================================================================ */

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading rental account...
      </div>
    );
  }


  /* ================================================================
     NOT FOUND
  ================================================================ */

  if (!rental) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Rental account could not be found.
        </p>

        <Button
          variant="outline"
          onClick={() => navigate("/rentals")}
        >
          Back to Rental Management
        </Button>
      </div>
    );
  }


  /* ================================================================
     CALCULATIONS
  ================================================================ */

  const outstandingBalance =
    Number(rental.outstanding_balance ?? 0);

  const hasOutstanding =
    outstandingBalance > 0;

  const totalRecurringCharge =
    Number(rental.rent_amount ?? 0) +
    Number(rental.service_charge ?? 0) +
    Number(rental.parking_fee ?? 0) +
    Number(rental.utility_charge ?? 0) +
    Number(rental.internet_fee ?? 0) +
    Number(rental.other_charge ?? 0) -
    Number(rental.default_discount ?? 0);


  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <>
      {/* ==========================================================
          PRINT STYLES
      =========================================================== */}

      <style>
        {`
          @media print {

            @page {
              size: A4;
              margin: 12mm;
            }

            html,
            body {
              background: white !important;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .rental-print-root {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .print-hidden {
              display: none !important;
            }

            .rental-card {
              break-inside: avoid;
              page-break-inside: avoid;
              box-shadow: none !important;
            }

            .rental-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            table {
              break-inside: auto;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            a {
              color: inherit !important;
              text-decoration: none !important;
            }
          }
        `}
      </style>


      <div className="rental-print-root max-w-[1400px] mx-auto">

        {/* ========================================================
            BREADCRUMB
        ========================================================= */}

        <div className="print-hidden">
          <Breadcrumb
            items={[
              {
                label: "Tenant & Lease",
              },
              {
                label: "Rental Management",
                to: "/rentals",
              },
              {
                label:
                  rental.rental_account_number,
              },
            ]}
          />
        </div>


        {/* ========================================================
            HEADER
        ========================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">

          <div>

            <div className="flex flex-wrap items-center gap-2 mb-1">

              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {rental.rental_account_number}
              </h1>

              <StatusBadge
                status={rental.status}
              />

            </div>

            <p className="text-sm text-muted-foreground font-tabular">

              {rental.rental_id_display}

              {" · "}

              {rental.lease_number}

              {" · "}

              {rental.tenant_name}

              {" · "}

              {rental.unit_number}

            </p>

          </div>


          {/* ======================================================
              ACTIONS
          ======================================================= */}

          <div className="flex flex-wrap gap-2 print-hidden">

            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/rentals/${rentalId}/edit`
                )
              }
            >
              Edit Rental
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadPdf}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>

          </div>

        </div>


        {/* ========================================================
            PRINT TITLE
        ========================================================= */}

        <div className="hidden print:block mb-6 border-b border-border pb-4">

          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Property Management System
          </p>

          <h1 className="text-2xl font-semibold mt-1">
            Rental Account Summary
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            {rental.rental_account_number}
          </p>

        </div>


        {/* ========================================================
            SUMMARY
        ========================================================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <StatCard
            label="Rent Amount"
            value={money(
              "ETB",
              rental.rent_amount
            )}
          />

          <StatCard
            label="Total Recurring Charge"
            value={money(
              "ETB",
              totalRecurringCharge
            )}
          />

          <StatCard
            label="Billing Frequency"
            value={formatLabel(
              rental.billing_frequency
            )}
          />

          <StatCard
            label="Outstanding Balance"
            value={money(
              "ETB",
              outstandingBalance
            )}
            danger={hasOutstanding}
          />

        </div>


        {/* ========================================================
            MAIN CONTENT
        ========================================================= */}

        <div className="space-y-6">


          {/* ======================================================
              ACCOUNT
          ======================================================= */}

          <SectionCard title="Rental Account">

            <InfoGrid columns={4}>

              <InfoRow
                label="Rental Account"
                value={
                  rental.rental_account_number
                }
              />

              <InfoRow
                label="Rental ID"
                value={
                  rental.rental_id_display
                }
              />

              <InfoRow
                label="Status"
                value={
                  <StatusBadge
                    status={rental.status}
                  />
                }
              />

              <InfoRow
                label="Rent Type"
                value={formatLabel(
                  rental.rent_type
                )}
              />

              <InfoRow
                label="Billing Frequency"
                value={formatLabel(
                  rental.billing_frequency
                )}
              />

              <InfoRow
                label="Lease"
                value={
                  rental.lease_number
                }
              />

            </InfoGrid>

          </SectionCard>


          {/* ======================================================
              TENANT & PROPERTY
          ======================================================= */}

          <SectionCard title="Tenant & Property">

            <InfoGrid columns={4}>

              <InfoRow
                label="Property"
                value={
                  rental.property_name
                }
              />

              <InfoRow
                label="Property ID"
                value={
                  rental.property_id
                }
              />

              <InfoRow
                label="Unit"
                value={
                  rental.unit_number
                }
              />

              <InfoRow
                label="Unit ID"
                value={
                  rental.unit_id
                }
              />

              <InfoRow
                label="Tenant"
                value={
                  rental.tenant_name
                }
              />

              <InfoRow
                label="Tenant ID"
                value={
                  rental.tenant_id
                }
              />

              <InfoRow
                label="Lease"
                value={
                  rental.lease_number
                }
              />

              <InfoRow
                label="Lease ID"
                value={
                  rental.lease
                }
              />

            </InfoGrid>

          </SectionCard>


          {/* ======================================================
              CHARGES
          ======================================================= */}

          <SectionCard title="Rental Charges">

            <InfoGrid columns={4}>

              <InfoRow
                label="Rent"
                value={money(
                  "ETB",
                  rental.rent_amount
                )}
              />

              <InfoRow
                label="Service Charge"
                value={money(
                  "ETB",
                  rental.service_charge
                )}
              />

              <InfoRow
                label="Parking Fee"
                value={money(
                  "ETB",
                  rental.parking_fee
                )}
              />

              <InfoRow
                label="Utility Charge"
                value={money(
                  "ETB",
                  rental.utility_charge
                )}
              />

              <InfoRow
                label="Internet Fee"
                value={money(
                  "ETB",
                  rental.internet_fee
                )}
              />

              <InfoRow
                label="Other Charge"
                value={money(
                  "ETB",
                  rental.other_charge
                )}
              />

              <InfoRow
                label="Default Discount"
                value={money(
                  "ETB",
                  rental.default_discount
                )}
              />

              <InfoRow
                label="Total Recurring Charge"
                value={money(
                  "ETB",
                  totalRecurringCharge
                )}
              />

            </InfoGrid>

          </SectionCard>


          {/* ======================================================
              ESCALATION & PENALTIES
          ======================================================= */}

          <SectionCard title="Escalation & Late Payment">

            <InfoGrid columns={3}>

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

              <InfoRow
                label="Grace Period"
                value={
                  rental.grace_period_days != null
                    ? `${rental.grace_period_days} days`
                    : "—"
                }
              />

              <InfoRow
                label="Late Payment Penalty"
                value={
                  rental.late_payment_penalty_percent != null
                    ? `${rental.late_payment_penalty_percent}%`
                    : "—"
                }
              />

              <InfoRow
                label="Late Interest Rate"
                value={
                  rental.late_interest_rate != null
                    ? `${rental.late_interest_rate}%`
                    : "—"
                }
              />

              <InfoRow
                label="Outstanding Balance"
                value={
                  <span
                    className={
                      hasOutstanding
                        ? "text-danger font-semibold"
                        : ""
                    }
                  >
                    {money(
                      "ETB",
                      outstandingBalance
                    )}
                  </span>
                }
              />

            </InfoGrid>

          </SectionCard>


          {/* ======================================================
              INVOICES
          ======================================================= */}

          <SectionCard title="Invoices">

            {invoicesLoading ? (

              <p className="text-sm text-muted-foreground py-4">
                Loading invoices...
              </p>

            ) : invoices.length === 0 ? (

              <p className="text-sm text-muted-foreground py-4">
                No invoices generated for this rental account yet.
              </p>

            ) : (

              <div className="overflow-x-auto">

                <Table>

                  <TableHeader>

                    <TableRow className="hover:bg-transparent">

                      <TableHead>
                        Invoice #
                      </TableHead>

                      <TableHead>
                        Billing Period
                      </TableHead>

                      <TableHead>
                        Due Date
                      </TableHead>

                      <TableHead className="text-right">
                        Total
                      </TableHead>

                      <TableHead className="text-right">
                        Paid
                      </TableHead>

                      <TableHead className="text-right">
                        Outstanding
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {invoices.map(
                      (invoice) => (

                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/invoices/${invoice.id}`
                            )
                          }
                        >

                          <TableCell className="font-medium font-tabular">

                            {invoice.invoice_number}

                          </TableCell>


                          <TableCell className="text-muted-foreground">

                            {formatDate(
                              invoice.billing_period_start
                            )}

                            {" → "}

                            {formatDate(
                              invoice.billing_period_end
                            )}

                          </TableCell>


                          <TableCell>

                            {formatDate(
                              invoice.due_date
                            )}

                          </TableCell>


                          <TableCell className="text-right font-tabular">

                            {money(
                              "ETB",
                              invoice.total_amount
                            )}

                          </TableCell>


                          <TableCell className="text-right font-tabular">

                            {money(
                              "ETB",
                              invoice.amount_paid
                            )}

                          </TableCell>


                          <TableCell className="text-right font-tabular">

                            {money(
                              "ETB",
                              invoice.outstanding_balance
                            )}

                          </TableCell>


                          <TableCell>

                            <StatusBadge
                              status={
                                invoice.status
                              }
                            />

                          </TableCell>

                        </TableRow>

                      )
                    )}

                  </TableBody>

                </Table>

              </div>

            )}

          </SectionCard>


          {/* ======================================================
              PAYMENTS
          ======================================================= */}

          <SectionCard title="Payments">

            {invoicesLoading ? (

              <p className="text-sm text-muted-foreground py-4">
                Loading payments...
              </p>

            ) : (

              <PaymentTable
                invoices={invoices}
                navigate={navigate}
              />

            )}

          </SectionCard>


          {/* ======================================================
              ADJUSTMENTS
          ======================================================= */}

          <SectionCard title="Rental Adjustments">

            {adjustmentsLoading ? (

              <p className="text-sm text-muted-foreground py-4">
                Loading adjustments...
              </p>

            ) : adjustments.length === 0 ? (

              <p className="text-sm text-muted-foreground py-4">
                No rental adjustments recorded.
              </p>

            ) : (

              <div className="overflow-x-auto">

                <Table>

                  <TableHeader>

                    <TableRow className="hover:bg-transparent">

                      <TableHead>
                        Type
                      </TableHead>

                      <TableHead>
                        Effective Date
                      </TableHead>

                      <TableHead className="text-right">
                        Amount
                      </TableHead>

                      <TableHead className="text-right">
                        Percentage
                      </TableHead>

                      <TableHead>
                        Reason
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {adjustments.map(
                      (adjustment) => (

                        <TableRow
                          key={adjustment.id}
                        >

                          <TableCell>
                            {formatLabel(
                              adjustment.adjustment_type
                            )}
                          </TableCell>

                          <TableCell>
                            {formatDate(
                              adjustment.effective_date
                            )}
                          </TableCell>

                          <TableCell className="text-right font-tabular">

                            {money(
                              "ETB",
                              adjustment.amount
                            )}

                          </TableCell>

                          <TableCell className="text-right font-tabular">

                            {adjustment.percentage != null
                              ? `${adjustment.percentage}%`
                              : "—"}

                          </TableCell>

                          <TableCell>
                            {adjustment.reason || "—"}
                          </TableCell>

                        </TableRow>

                      )
                    )}

                  </TableBody>

                </Table>

              </div>

            )}

          </SectionCard>


          {/* ======================================================
              DEPOSIT
          ======================================================= */}

          <SectionCard title="Security Deposit">

            {depositsLoading ? (

              <p className="text-sm text-muted-foreground py-4">
                Loading deposit...
              </p>

            ) : deposits.length === 0 ? (

              <p className="text-sm text-muted-foreground py-4">
                No security deposit record found.
              </p>

            ) : (

              <div className="overflow-x-auto">

                <Table>

                  <TableHeader>

                    <TableRow className="hover:bg-transparent">

                      <TableHead>
                        Security Deposit
                      </TableHead>

                      <TableHead>
                        Current Balance
                      </TableHead>

                      <TableHead>
                        Refund Status
                      </TableHead>

                      <TableHead>
                        Refunded Amount
                      </TableHead>

                      <TableHead>
                        Refund Date
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {deposits.map(
                      (deposit) => (

                        <TableRow
                          key={deposit.id}
                        >

                          <TableCell className="font-tabular">

                            {money(
                              "ETB",
                              deposit.security_deposit
                            )}

                          </TableCell>

                          <TableCell className="font-tabular">

                            {money(
                              "ETB",
                              deposit.deposit_balance
                            )}

                          </TableCell>

                          <TableCell>

                            <StatusBadge
                              status={
                                deposit.refund_status
                              }
                            />

                          </TableCell>

                          <TableCell className="font-tabular">

                            {money(
                              "ETB",
                              deposit.refunded_amount
                            )}

                          </TableCell>

                          <TableCell>

                            {formatDate(
                              deposit.refund_date
                            )}

                          </TableCell>

                        </TableRow>

                      )
                    )}

                  </TableBody>

                </Table>

              </div>

            )}

          </SectionCard>


          {/* ======================================================
              ACCOUNTING
          ======================================================= */}

          <SectionCard title="Accounting">

            <InfoGrid columns={3}>

              <InfoRow
                label="GL Account"
                value={
                  rental.gl_account || "—"
                }
              />

              <InfoRow
                label="Cost Center"
                value={
                  rental.cost_center || "—"
                }
              />

              <InfoRow
                label="Financial Posting Status"
                value={formatLabel(
                  rental.financial_posting_status
                )}
              />

            </InfoGrid>

          </SectionCard>


          {/* ======================================================
              AUDIT
          ======================================================= */}

          <SectionCard title="Audit Information">

            <InfoGrid columns={2}>

              <InfoRow
                label="Created"
                value={formatDateTime(
                  rental.created_at
                )}
              />

              <InfoRow
                label="Last Updated"
                value={formatDateTime(
                  rental.updated_at
                )}
              />

            </InfoGrid>

          </SectionCard>


          {/* ======================================================
              PRINT FOOTER
          ======================================================= */}

          <div className="hidden print:block border-t border-border pt-4 mt-8">

            <div className="flex justify-between text-[10px] text-muted-foreground">

              <span>
                Property Management System
              </span>

              <span>
                Generated{" "}
                {new Date().toLocaleDateString()}
              </span>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}


/* ================================================================
   PAYMENT TABLE
================================================================ */

function PaymentTable({
  invoices,
  navigate,
}: {
  invoices: Invoice[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const payments = invoices.flatMap(
    (invoice) =>
      (invoice.payments ?? []).map(
        (payment) => ({
          ...payment,
          invoice_number:
            payment.invoice_number ||
            invoice.invoice_number,
        })
      )
  );

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No payments recorded for this rental account.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">

      <Table>

        <TableHeader>

          <TableRow className="hover:bg-transparent">

            <TableHead>
              Receipt #
            </TableHead>

            <TableHead>
              Invoice #
            </TableHead>

            <TableHead>
              Paid Date
            </TableHead>

            <TableHead>
              Method
            </TableHead>

            <TableHead className="text-right">
              Amount
            </TableHead>

            <TableHead>
              Transaction Reference
            </TableHead>

          </TableRow>

        </TableHeader>


        <TableBody>

          {payments.map(
            (payment) => (

              <TableRow
                key={payment.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate(
                    `/invoices/${payment.invoice}`
                  )
                }
              >

                <TableCell className="font-medium">
                  {payment.receipt_number || "—"}
                </TableCell>

                <TableCell>
                  {payment.invoice_number}
                </TableCell>

                <TableCell>
                  {formatDateTime(
                    payment.paid_at
                  )}
                </TableCell>

                <TableCell>
                  {formatLabel(
                    payment.method
                  )}
                </TableCell>

                <TableCell className="text-right font-tabular">
                  {money(
                    "ETB",
                    payment.amount
                  )}
                </TableCell>

                <TableCell>
                  {payment.transaction_reference ||
                    "—"}
                </TableCell>

              </TableRow>

            )
          )}

        </TableBody>

      </Table>

    </div>
  );
}


/* ================================================================
   REUSABLE COMPONENTS
================================================================ */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="rental-card rental-section overflow-hidden">

      <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">

        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>

      </CardHeader>

      <CardContent className="p-5">
        {children}
      </CardContent>

    </Card>
  );
}


function InfoGrid({
  columns = 3,
  children,
}: {
  columns?: 2 | 3 | 4;
  children: ReactNode;
}) {
  const gridClass =
    columns === 4
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5"
      : columns === 3
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5"
        : "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5";

  return (
    <div className={gridClass}>
      {children}
    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">

      <p className="text-xs text-muted-foreground mb-1">
        {label}
      </p>

      <div className="text-sm text-foreground break-words">
        {value ?? "—"}
      </div>

    </div>
  );
}


function StatCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: ReactNode;
  danger?: boolean;
}) {
  return (
    <Card className="rental-card p-4">

      <p className="text-xs text-muted-foreground mb-1">
        {label}
      </p>

      <p
        className={`text-lg font-semibold font-tabular ${
          danger
            ? "text-danger"
            : "text-foreground"
        }`}
      >
        {value}
      </p>

    </Card>
  );
}


/* ================================================================
   FORMATTERS
================================================================ */

function money(
  currency: string | undefined,
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `${currency || "ETB"} ${amount.toLocaleString()}`;
}


function formatDate(value: unknown): string {
  if (!value) {
    return "—";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}


function formatDateTime(value: unknown): string {
  if (!value) {
    return "—";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}


function formatLabel(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}