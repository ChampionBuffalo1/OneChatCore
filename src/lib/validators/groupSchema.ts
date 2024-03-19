import { z } from 'zod';

const groupCreateSchema = z.object({
  name: z
    .string({
      required_error: 'Name field missing'
    })
    .max(64, 'name should not exceed 64 character limit'),
  description: z.string().optional()
});

// min(1) is added to optional property so that if those keys are provided then the value cant be empty string
const editGroupSchema = z.object({
  name: z.string().min(1).max(64, 'group name should not exceed 64 character limit').optional(),
  description: z.string().optional()
});

const inviteSchema = z.object({
  groupId: z.string({
    required_error: 'Group ID missing'
  }),
  expiresAt: z.coerce
    .date()
    .refine(expiresAt => expiresAt > new Date())
    .optional(),
  limit: z.number().min(1, 'Limit cannot be less than 1').optional()
});

const groupUpdateSchema = z.object({
  name: z.string().min(1, 'Name cannot be an empty!').max(64, 'name should not exceed 64 character limit').optional(),
  description: z.string().optional()
});

export { editGroupSchema, groupCreateSchema, groupUpdateSchema, inviteSchema };
