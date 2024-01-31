//  000     00       000
// GROUP   ROLE    MESSAGE
export const Permissions = {
  READ_MESSAGES: 1 << 0, // 000 00 001
  WRITE_MESSAGES: 1 << 1,
  MANAGE_MESSAGES: 1 << 2,

  ASSIGN_ROLES: 1 << 3,
  MANAGE_ROLES: 1 << 4,

  INVITE_MEMBER: 1 << 5,
  KICK_MEMBER: 1 << 6,
  MANAGE_GROUP: 1 << 7, // modify group name, desc etc
  ADMININSTRATOR: (1 << 7) - 1 // 111 11 111
};

// Reference: https://en.wikipedia.org/wiki/Mask_(computing)#Common_bitmask_functions
// Eg: (READ|WRITE) & READ !== 0 then permissionBits "set" has the READ bit enabled
export function checkPermission(permissionBits: number, permission: keyof typeof Permissions): boolean {
  return (permissionBits & Permissions[permission]) !== 0;
}

export function setPermission(permissionBits: number, permission: keyof typeof Permissions): number {
  return permissionBits | Permissions[permission];
}

export function removePermission(permissionBits: number, permission: keyof typeof Permissions): number {
  return permissionBits ^ Permissions[permission];
}


