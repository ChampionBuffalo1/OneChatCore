import { z } from 'zod';

const WsMessageSchema = z.object({
  text: z.string().max(4000),
  attachments: z.optional(z.array(z.string())),
  groupId: z.optional(z.string()),
  directMessageId: z.optional(z.string()),
  sender: z.object({
    id: z.string().min(1),
    username: z.string().min(1)
  })
});

type WsMessageSchema = z.infer<typeof WsMessageSchema>;

export { WsMessageSchema };
