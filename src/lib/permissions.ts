//  000       0        000
// GROUP  PERMISSION  MESSAGE
export const Permissions = {
  READ_MESSAGES: 1 << 0, // 000 00 001
  WRITE_MESSAGES: 1 << 1,
  MANAGE_MESSAGES: (1 << 2) | (1 << 1) | (1 << 0),

  CHANGE_PERMISSION: 1 << 3, // 1

  INVITE_MEMBER: 1 << 4,
  KICK_MEMBER: 1 << 5,
  MANAGE_GROUP: 1 << 6, // modify group name, desc etc
  ADMINISTRATOR: (1 << 6) - 1 // 111 11 111
};

type AllPermissions = keyof typeof Permissions;
type AllowedPermission = AllPermissions | AllPermissions[];
type PermissionRecord = {
  denied: AllPermissions[];
  allowed: AllPermissions[];
};

// Reference: https://en.wikipedia.org/wiki/Mask_(computing)#Common_bitmask_functions
// Eg: (READ|WRITE) & READ !== 0 then permissionBits "set" has the READ bit enabled
export function checkPermission(permissionBits: number, permission: AllPermissions): boolean {
  return (permissionBits & Permissions[permission]) !== 0;
}

export function checkMultiplePermission(permissionBits: number, permissions: AllowedPermission): PermissionRecord {
  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }

  const result = {
    denied: [],
    allowed: []
  } as PermissionRecord;

  for (const permission of permissions) {
    if (checkPermission(permissionBits, permission)) {
      result.allowed.push(permission);
    } else {
      result.denied.push(permission);
    }
  }
  return result;
}

export function setPermission(permissionBits: number, permissions: AllowedPermission): number {
  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }
  let updatedPermissionBits = permissionBits;
  for (const permission of permissions) {
    updatedPermissionBits |= Permissions[permission];
  }
  return updatedPermissionBits;
}

export function removePermission(permissionBits: number, permissions: AllowedPermission): number {
  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }
  let updatedPermissionBits = permissionBits;
  for (const permission of permissions) {
    updatedPermissionBits ^= Permissions[permission];
  }
  return updatedPermissionBits;
}
