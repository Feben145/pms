/**
 * LeaseDetailPage
 *
 * Read-focused one-page lease record.
 *
 * The edit page remains responsible for editing lease information.
 * This page is intended for:
 * - reviewing a lease
 * - approving a lease
 * - terminating a lease
 * - viewing invoices/documents
 * - printing
 * - saving the lease record as PDF
 */

import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Printer,
  Download,
} from "lucide-react";

import { apiClient } from "../../api/client";
import type { Lease, Invoice } from "../../types/models";
import { useCollection } from "../../hooks/useCollection";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { hasApprovalPrivilege } from "../../lib/approvals";

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

export default function LeaseDetailPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();

  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const { user } = useCurrentUser();

  const {
    items: invoices,
    isLoading: invoicesLoading,
  } = useCollection<Invoice>("/rentals/", {
    lease: leaseId!,
  });

  useEffect(() => {
    if (leaseId) {
      loadLease();
    }
  }, [leaseId]);

  async function loadLease() {
    if (!leaseId) return;

    try {
      setIsLoading(true);

      const { data } = await apiClient.get<Lease>(
        `/leases/${leaseId}/`
      );

      setLease(data);
    } catch (error) {
      console.error("Failed to load lease:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTerminate() {
    if (!lease || !leaseId) return;

    const confirmed = window.confirm(
      `Terminate lease ${lease.lease_number}? This will free up the unit for reassignment.`
    );

    if (!confirmed) return;

    try {
      setIsTerminating(true);

      await apiClient.patch(`/leases/${leaseId}/`, {
        status: "terminated",
      });

      await loadLease();
    } catch (error) {
      console.error("Failed to terminate lease:", error);
      alert("Could not terminate this lease.");
    } finally {
      setIsTerminating(false);
    }
  }

  async function handleApprove() {
    if (!lease || !leaseId) return;

    setIsApproving(true);

    try {
      await apiClient.post(`/leases/${leaseId}/approve/`);
      await loadLease();
    } catch (error) {
      console.error("Failed to approve lease:", error);

      alert(
        "Could not approve this lease. You may not have approval privileges."
      );
    } finally {
      setIsApproving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    /*
     * Browser-native PDF export.
     *
     * The print stylesheet hides buttons/navigation and keeps
     * the lease record optimized for A4 printing.
     *
     * In the browser print dialog choose:
     * Destination → Save as PDF
     */
    window.print();
  }

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading lease...
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Lease could not be found.
        </p>

        <Button
          variant="outline"
          onClick={() => navigate("/leases")}
        >
          Back to Lease Management
        </Button>
      </div>
    );
  }

  const canTerminate =
    lease.status === "active" ||
    lease.status === "renewal_pending";

  const canApprove =
    (lease.status === "draft" ||
      lease.status === "pending_approval") &&
    hasApprovalPrivilege(user?.role);

  const outstandingBalance =
    Number(lease.outstanding_balance ?? 0);

  const hasOutstanding = outstandingBalance > 0;

  const totalMonthlyCharge =
    Number(
      (lease as any).total_monthly_charge ??
        Number(lease.monthly_rent ?? 0) +
          Number((lease as any).service_charge ?? 0) +
          Number(lease.parking_fee ?? 0)
    );

  return (
    <>
      {/* Print stylesheet */}
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

            .lease-print-root {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .print-hidden {
              display: none !important;
            }

            .lease-card {
              break-inside: avoid;
              page-break-inside: avoid;
              box-shadow: none !important;
            }

            .lease-section {
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

            .print-break-before {
              break-before: page;
              page-break-before: always;
            }

            .print-no-border {
              border: none !important;
            }

            a {
              color: inherit !important;
              text-decoration: none !important;
            }
          }
        `}
      </style>

      <div className="lease-print-root max-w-[1400px] mx-auto">
        {/* Breadcrumb */}
        <div className="print-hidden">
          <Breadcrumb
            items={[
              { label: "Tenant & Lease" },
              {
                label: "Lease Management",
                to: "/leases",
              },
              {
                label: lease.lease_number,
              },
            ]}
          />
        </div>

        {/* =========================================================
            HEADER
        ========================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {lease.lease_number}
              </h1>

              <StatusBadge status={lease.status} />

              <span className="text-xs text-muted-foreground font-tabular">
                {lease.lease_version}
              </span>
            </div>

            <p className="text-sm text-muted-foreground font-tabular">
              {lease.lease_id_display}
              {" · "}
              {lease.tenant_name}
              {" · "}
              {lease.unit_number}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 print-hidden">
            {canApprove && (
              <Button
                variant="accent"
                disabled={isApproving}
                onClick={handleApprove}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            )}

            {canTerminate && (
              <Button
                variant="outline"
                disabled={isTerminating}
                className="text-danger border-danger/30 hover:bg-[var(--color-danger-soft)]"
                onClick={handleTerminate}
              >
                {isTerminating ? "Terminating..." : "Terminate"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() =>
                navigate(`/leases/${leaseId}/edit`)
              }
            >
              Edit Lease
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

        {/* Printable document heading */}
        <div className="hidden print:block mb-6 border-b border-border pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Property Management System
          </p>

          <h1 className="text-2xl font-semibold mt-1">
            Lease Summary
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            {lease.lease_number}
          </p>
        </div>

        {/* =========================================================
            SUMMARY CARDS
        ========================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Monthly Rent"
            value={`${lease.currency} ${formatNumber(
              lease.monthly_rent
            )}`}
          />

          <StatCard
            label="Security Deposit"
            value={`${lease.currency} ${formatNumber(
              lease.security_deposit
            )}`}
          />

          <StatCard
            label="Lease Term"
            value={`${lease.start_date} → ${lease.end_date}`}
          />

          <StatCard
            label="Outstanding Balance"
            value={`${lease.currency} ${formatNumber(
              outstandingBalance
            )}`}
            danger={hasOutstanding}
          />
        </div>

        {/* =========================================================
            MAIN CONTENT
        ========================================================== */}

        <div className="space-y-6">
          {/* IDENTIFICATION */}
          <SectionCard title="Identification">
            <InfoGrid columns={4}>
              <InfoRow
                label="Lease Number"
                value={lease.lease_number}
              />

              <InfoRow
                label="Lease Type"
                value={formatLabel(
                  (lease as any).lease_type
                )}
              />

              <InfoRow
                label="Lease ID"
                value={lease.lease_id_display}
              />

              <InfoRow
                label="Lease Version"
                value={lease.lease_version}
              />

              <InfoRow
                label="Status"
                value={
                  <StatusBadge status={lease.status} />
                }
              />

              <InfoRow
                label="Approval Status"
                value={formatLabel(
                  lease.approval_status
                )}
              />
            </InfoGrid>
          </SectionCard>

          {/* TENANT & PROPERTY */}
          <SectionCard title="Tenant & Property">
            <InfoGrid columns={4}>
              <InfoRow
                label="Property"
                value={lease.property_name}
              />

              <InfoRow
                label="Building"
                value={lease.building_name}
              />

              <InfoRow
                label="Unit"
                value={lease.unit_number}
              />

              <InfoRow
                label="Tenant"
                value={lease.tenant_name}
              />

              <InfoRow
                label="Tenant Contact"
                value={
                  lease.tenant_contact_number
                }
              />

              <InfoRow
                label="Tenant Email"
                value={
                  lease.tenant_email || "—"
                }
              />

              <InfoRow
                label="Tenant Type"
                value={formatLabel(
                  (lease as any).tenant_type
                )}
              />
            </InfoGrid>
          </SectionCard>

          {/* DATES */}
          <SectionCard title="Dates & Lease Terms">
            <InfoGrid columns={4}>
              <InfoRow
                label="Lease Start Date"
                value={formatDate(lease.start_date)}
              />

              <InfoRow
                label="Lease End Date"
                value={formatDate(lease.end_date)}
              />

              <InfoRow
                label="Move-in Date"
                value={formatDate(
                  (lease as any).move_in_date
                )}
              />

              <InfoRow
                label="Move-out Date"
                value={formatDate(
                  (lease as any).move_out_date
                )}
              />

              <InfoRow
                label="Lease Duration"
                value={
                  (lease as any).lease_duration_days != null
                    ? `${(lease as any).lease_duration_days} days`
                    : "—"
                }
              />

              <InfoRow
                label="Renewal Notice"
                value={
                  (lease as any)
                    .renewal_notice_period_days != null
                    ? `${(lease as any).renewal_notice_period_days} days`
                    : "—"
                }
              />

              <InfoRow
                label="Renewal Period"
                value={
                  (lease as any).renewal_period_months != null
                    ? `${(lease as any).renewal_period_months} months`
                    : "—"
                }
              />

              <InfoRow
                label="Early Termination Notice"
                value={
                  (lease as any)
                    .early_termination_notice_days != null
                    ? `${(lease as any).early_termination_notice_days} days`
                    : "—"
                }
              />
            </InfoGrid>
          </SectionCard>

          {/* FINANCIAL */}
          <SectionCard title="Financial">
            <InfoGrid columns={4}>
              <InfoRow
                label="Monthly Rent"
                value={money(
                  lease.currency,
                  lease.monthly_rent
                )}
              />

              <InfoRow
                label="Security Deposit"
                value={money(
                  lease.currency,
                  lease.security_deposit
                )}
              />

              <InfoRow
                label="Service Charge"
                value={money(
                  lease.currency,
                  (lease as any).service_charge
                )}
              />

              <InfoRow
                label="Parking Fee"
                value={money(
                  lease.currency,
                  lease.parking_fee
                )}
              />

              <InfoRow
                label="Currency"
                value={lease.currency}
              />

              <InfoRow
                label="Payment Frequency"
                value={formatLabel(
                  (lease as any).billing_frequency
                )}
              />

              <InfoRow
                label="Payment Due Day"
                value={
                  (lease as any).payment_due_day != null
                    ? String(
                        (lease as any).payment_due_day
                      )
                    : "—"
                }
              />

              <InfoRow
                label="Total Monthly Charge"
                value={money(
                  lease.currency,
                  totalMonthlyCharge
                )}
              />

              <InfoRow
                label="Rent Escalation Type"
                value={formatLabel(
                  (lease as any).rent_escalation_type
                )}
              />

              <InfoRow
                label="Rent Escalation"
                value={
                  (lease as any)
                    .rent_escalation_percent != null
                    ? `${(lease as any).rent_escalation_percent}%`
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
                      lease.currency,
                      outstandingBalance
                    )}
                  </span>
                }
              />
            </InfoGrid>
          </SectionCard>

          {/* UTILITIES */}
          <SectionCard title="Utilities & Charges">
            <div className="space-y-6">
              {/* Unit configuration */}
              <div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground">
                    Unit Utility Configuration
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Physical utility configuration inherited
                    from the selected unit.
                  </p>
                </div>

                <InfoGrid columns={3}>
                  <InfoRow
                    label="Electricity Meter"
                    value={
                      (lease as any)
                        .electricity_meter_number ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Water Meter"
                    value={
                      (lease as any)
                        .water_meter_number ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Gas Meter"
                    value={
                      (lease as any)
                        .gas_meter_number ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Utility Account"
                    value={
                      (lease as any)
                        .utility_account_number ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Billing Method"
                    value={formatLabel(
                      (lease as any)
                        .utility_billing_method
                    )}
                  />

                  <InfoRow
                    label="Internet Connection"
                    value={
                      (lease as any).internet_connection
                        ? "Available"
                        : "Not Available"
                    }
                  />
                </InfoGrid>
              </div>

              {/* Lease charges */}
              <div className="pt-5 border-t border-border">
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground">
                    Lease Utility Charges
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Charges agreed with the tenant for this
                    lease.
                  </p>
                </div>

                <InfoGrid columns={3}>
                  <InfoRow
                    label="Electricity"
                    value={money(
                      lease.currency,
                      lease.electricity_charge
                    )}
                  />

                  <InfoRow
                    label="Water"
                    value={money(
                      lease.currency,
                      lease.water_charge
                    )}
                  />

                  <InfoRow
                    label="Gas"
                    value={money(
                      lease.currency,
                      lease.gas_charge
                    )}
                  />

                  <InfoRow
                    label="Internet"
                    value={money(
                      lease.currency,
                      lease.internet_charge
                    )}
                  />

                  <InfoRow
                    label="Other Utility"
                    value={money(
                      lease.currency,
                      lease.other_utility_charge
                    )}
                  />

                  <InfoRow
                    label="Parking"
                    value={money(
                      lease.currency,
                      lease.parking_fee
                    )}
                  />
                </InfoGrid>
              </div>
            </div>
          </SectionCard>

          {/* BILLING */}
          <SectionCard title="Billing & Payment">
            <InfoGrid columns={3}>
              <InfoRow
                label="Invoice Generation"
                value={formatLabel(
                  (lease as any)
                    .invoice_generation_term_type
                )}
              />

              {(lease as any)
                .invoice_generation_term_type ===
              "relative" ? (
                <InfoRow
                  label="Days Before Due Date"
                  value={
                    (lease as any)
                      .invoice_generation_relative_days !=
                    null
                      ? `${(lease as any).invoice_generation_relative_days} days`
                      : "—"
                  }
                />
              ) : (
                <InfoRow
                  label="Generation Day"
                  value={
                    (lease as any)
                      .invoice_generation_day !=
                    null
                      ? String(
                          (lease as any)
                            .invoice_generation_day
                        )
                      : "—"
                  }
                />
              )}

              <InfoRow
                label="Payment Method"
                value={formatLabel(
                  (lease as any).payment_method
                )}
              />

              <InfoRow
                label="Bank Account"
                value={
                  (lease as any).bank_account ||
                  "—"
                }
              />

              <InfoRow
                label="Late Payment Penalty"
                value={
                  (lease as any)
                    .late_payment_penalty_percent !=
                  null
                    ? `${(lease as any).late_payment_penalty_percent}%`
                    : "—"
                }
              />

              <InfoRow
                label="Grace Period"
                value={
                  (lease as any).grace_period_days !=
                  null
                    ? `${(lease as any).grace_period_days} days`
                    : "—"
                }
              />
            </InfoGrid>
          </SectionCard>

          {/* INVOICES */}
          <SectionCard title="Invoices">
            {invoicesLoading ? (
              <p className="text-sm text-muted-foreground py-4">
                Loading invoices...
              </p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No invoices generated yet for this lease.
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
                        Due
                      </TableHead>

                      <TableHead className="text-right">
                        Total
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
                    {invoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate("/invoices")
                        }
                      >
                        <TableCell className="font-medium font-tabular">
                          {invoice.invoice_number}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {formatDate(invoice.due_date)}
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
                            invoice.outstanding_balance
                          )}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={invoice.status}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* TERMS */}
          <SectionCard title="Terms & Conditions">
            <InfoGrid columns={3}>
              <InfoRow
                label="Renewal Option"
                value={
                  (lease as any).renewal_option
                    ? "Yes"
                    : "No"
                }
              />

              <InfoRow
                label="Early Termination"
                value={
                  (lease as any)
                    .early_termination_allowed
                    ? "Allowed"
                    : "Not Allowed"
                }
              />

              <InfoRow
                label="Insurance Required"
                value={
                  (lease as any).insurance_required
                    ? "Yes"
                    : "No"
                }
              />

              <InfoRow
                label="Subletting"
                value={
                  (lease as any).subletting_allowed
                    ? "Allowed"
                    : "Not Allowed"
                }
              />

              <InfoRow
                label="Maintenance Responsibility"
                value={formatLabel(
                  (lease as any)
                    .maintenance_responsibility
                )}
              />

              <InfoRow
                label="Pet Policy"
                value={formatLabel(
                  (lease as any).pet_policy
                )}
              />
            </InfoGrid>
          </SectionCard>

          {/* DOCUMENTS */}
          <SectionCard title="Documents">
            {(lease.documents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No documents uploaded.
              </p>
            ) : (
              <div className="space-y-2">
                {(lease.documents ?? []).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />

                      <span>{doc.name}</span>
                    </span>

                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline text-xs"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* APPROVAL + AUDIT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Approval">
              <InfoGrid columns={2}>
                <InfoRow
                  label="Status"
                  value={formatLabel(
                    lease.approval_status
                  )}
                />

                <InfoRow
                  label="Digital Signature"
                  value={formatLabel(
                    lease.digital_signature_status
                  )}
                />

                <InfoRow
                  label="Approved By"
                  value={
                    lease.approved_by_username ||
                    "—"
                  }
                />

                <InfoRow
                  label="Approval Date"
                  value={formatDate(
                    lease.approval_date
                  )}
                />
              </InfoGrid>
            </SectionCard>

            <SectionCard title="Audit Information">
              <InfoGrid columns={2}>
                <InfoRow
                  label="Created By"
                  value={
                    lease.created_by_username ||
                    "—"
                  }
                />

                <InfoRow
                  label="Created"
                  value={formatDateTime(
                    lease.created_at
                  )}
                />

                <InfoRow
                  label="Updated By"
                  value={
                    lease.updated_by_username ||
                    "—"
                  }
                />

                <InfoRow
                  label="Last Updated"
                  value={formatDateTime(
                    lease.updated_at
                  )}
                />
              </InfoGrid>
            </SectionCard>
          </div>

          {/* Printable footer */}
          <div className="hidden print:block border-t border-border pt-4 mt-8">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>
                Property Management System
              </span>

              <span>
                Generated {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
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
    <Card className="lease-card lease-section overflow-hidden">
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
    <Card className="lease-card p-4">
      <p className="text-xs text-muted-foreground mb-1">
        {label}
      </p>

      <p
        className={`text-lg font-semibold font-tabular ${
          danger ? "text-danger" : "text-foreground"
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

function formatNumber(value: unknown): string {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString();
}

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