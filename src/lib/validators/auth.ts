import { z } from 'zod';

const authBody = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty()
});

type authBody = z.infer<typeof authBody>;

export { authBody };
