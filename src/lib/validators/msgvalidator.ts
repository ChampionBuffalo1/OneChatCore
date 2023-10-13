import { z } from 'zod';

const messageId = z.object({
  id: z.string().min(1)
});

const messageText = z.object({
  text: z.string().min(1)
});

const messageQuery = z
  .object({
    after: z.date().optional(),
    before: z.date().optional(),
    limit: z.number().optional()
  })
  .merge(messageId);

const messageUpdate = messageText.merge(messageId);

export { messageQuery, messageUpdate, messageId, messageText };
