// src/lib/approvals.ts

export function hasApprovalPrivilege(role?: string): boolean {
  if (!role) return false;
  
  // Must match the backend's APPROVAL_ROLES = {"owner", "property_manager"}
  const privilegedRoles = ["owner", "property_manager"];
  return privilegedRoles.includes(role.toLowerCase());
}