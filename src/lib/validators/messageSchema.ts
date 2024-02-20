import { z } from 'zod';

const messageCreate = z.object({
  text: z.string().min(1)
});

const messageEdit = z.object({
  id: z.string(),
  text: z.string().min(1)
});

const messageFilter = z.object({
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional()
});

export { messageCreate, messageEdit, messageFilter };
