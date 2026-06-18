import { getAdminSession } from "./auth.js";

export const ROLE_OWNER = "owner";
export const ROLE_ADMIN = "admin";
export const ROLE_SALES = "sales";
export const ROLE_CONTRACTOR = "contractor";
export const ROLE_VIEWER = "viewer";

export const ALL_ROLES = [
  ROLE_OWNER,
  ROLE_ADMIN,
  ROLE_SALES,
  ROLE_CONTRACTOR,
  ROLE_VIEWER
];

const USER_MANAGEMENT_ROLES = [ROLE_OWNER, ROLE_ADMIN];
const TENANT_MANAGEMENT_ROLES = [ROLE_OWNER, ROLE_ADMIN];
const LEAD_MANAGEMENT_ROLES = [ROLE_OWNER, ROLE_ADMIN, ROLE_SALES];
const CONTRACTOR_MANAGEMENT_ROLES = [ROLE_OWNER, ROLE_ADMIN];
const DASHBOARD_VIEW_ROLES = ALL_ROLES;

export class PermissionError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = "PermissionError";
    this.status = status;
  }
}

export async function requireSession() {
  const session = await getAdminSession();
  if (!session) throw new PermissionError("Authentication required.", 401);
  return session;
}

export async function requireRole(allowedRoles) {
  const session = await requireSession();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!allowed.includes(session.role)) throw new PermissionError("Forbidden.", 403);
  return session;
}

export function canManageUsers(session) {
  return USER_MANAGEMENT_ROLES.includes(session?.role);
}

export function canManageTenants(session) {
  return TENANT_MANAGEMENT_ROLES.includes(session?.role);
}

export function canManageLeads(session) {
  return LEAD_MANAGEMENT_ROLES.includes(session?.role);
}

export function canManageContractors(session) {
  return CONTRACTOR_MANAGEMENT_ROLES.includes(session?.role);
}

export function canViewDashboard(session) {
  return DASHBOARD_VIEW_ROLES.includes(session?.role);
}

export function permissionDeniedResponse(error, request) {
  const status = error instanceof PermissionError ? error.status : error?.status;
  if (![401, 403].includes(status)) throw error;
  if (status === 401) {
    return Response.redirect(new URL("/admin/login", request.url), 303);
  }

  return Response.json({ error: error.message || "Forbidden." }, { status: 403 });
}
