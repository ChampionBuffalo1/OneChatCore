import { z } from 'zod';
import { maxPassLen } from '../../Constants';

const authBody = z.object({
  username: z
    .string({
      required_error: 'Username field missing.'
    })
    .max(64, 'Username should not exceed 64 character limit.'),
  password: z
    .string({
      required_error: 'Password field missing.'
    })
    .max(maxPassLen, `Password should not exceed ${maxPassLen} character limit`)
});

type authBody = z.infer<typeof authBody>;

export { authBody };
