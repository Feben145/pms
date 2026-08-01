import { Badge, type BadgeProps } from "./ui/badge";

/**
 * Maps a backend status string to a semantic Badge variant, grouped by
 * meaning (good/neutral/warning/bad) rather than one entry per exact
 * status string -- so a new backend status value falls back to
 * "neutral" instead of rendering unstyled.
 */
const VARIANT_MAP: Record<string, BadgeProps["variant"]> = {
  active: "success",
  leased: "success",
  paid: "success",
  approved: "success",
  active_tenant: "success",
  lease_signed: "success",
  draft: "neutral",
  vacant: "neutral",
  prospect: "neutral",
  application_submitted: "neutral",
  former_tenant: "neutral",
  reserved: "info",
  pending_approval: "warning",
  kyc_pending: "warning",
  kyc_verification: "warning",
  partially_paid: "warning",
  renewal_pending: "warning",
  lease_renewal: "warning",
  under_maintenance: "warning",
  under_construction: "warning",
  under_renovation: "warning",
  move_out: "warning",
  expiring: "warning",
  overdue: "danger",
  terminated: "danger",
  expired: "danger",
  cancelled: "danger",
  blocked: "danger",
  closed: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = VARIANT_MAP[status] ?? "neutral";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
