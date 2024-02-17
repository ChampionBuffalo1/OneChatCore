import { z } from 'zod';
import { maxPassLen } from '../../Constants';

const userPatch = z.object({
  username: z.string().min(1, 'Username must be at least 1 character.').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(maxPassLen, `Password should not exceed ${maxPassLen} character limit`)
    .optional()
});

export { userPatch };
