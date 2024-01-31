import { z } from 'zod';

const messageId = z.object({
  id: z.string({
    required_error: 'Id is missing'
  })
});

const messageText = z.object({
  text: z.string({
    required_error: 'Message text is missing'
  })
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
