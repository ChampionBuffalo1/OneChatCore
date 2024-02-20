import { z } from 'zod';
import { Permissions } from '../permissions';

const permissionChange = z.object({
  permissions: z.array(
    z.object({
      method: z.enum(['add', 'remove']),
      permission: z.enum(Object.keys(Permissions) as [string])
    })
  )
});

export { permissionChange };
