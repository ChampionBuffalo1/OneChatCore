import { z } from 'zod';

const editGroupProps = z.object({
  name: z.string().min(1)
});

export { editGroupProps };
