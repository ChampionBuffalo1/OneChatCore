import { z } from 'zod';

const permissionChange = z.object({
  userId: z.string(),
  permissions: z.number()
});

const getPermission = z.object({
  userId: z.string().optional()
});

export { getPermission, permissionChange };
