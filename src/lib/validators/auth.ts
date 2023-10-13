import { z } from 'zod';

const authBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

type authBody = z.infer<typeof authBody>;

export { authBody };
