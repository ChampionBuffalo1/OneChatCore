import { z } from 'zod';

const groupNameSchema = z.object({
  name: z
    .string({
      required_error: 'Name field missing'
    })
    .max(64, 'name should not exceed 64 character limit')
});

const editGroupSchema = groupNameSchema;

export { editGroupSchema, groupNameSchema };
