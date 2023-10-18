import { z } from 'zod';

const groupName = z.object({
  name: z.string().min(1)
});

const editGroupProps = groupName;

export { editGroupProps, groupName };
