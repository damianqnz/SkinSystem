/** Valid roles in `profiles.role` (mirror of `userRoleEnum`). */
export type UserRole = 'super_admin' | 'owner' | 'staff';

/** Any of these roles = legitimate dashboard user. */
export const STAFF_ROLES: readonly UserRole[] = ['super_admin', 'owner', 'staff'];

/** Discriminant telling callers exactly WHY they were rejected. */
export type ResolveTenantError =
  | 'NO_TENANT'
  | 'NO_AUTH'
  | 'ORG_NOT_FOUND'
  | 'NOT_MEMBER'
  | 'INACTIVE'
  | 'FORBIDDEN';

export type ResolveTenantOk = {
  orgId:  string;
  userId: string;
  role:   UserRole;
};

export type ResolveTenantResult =
  | ResolveTenantOk
  | { error: string; code: ResolveTenantError };
