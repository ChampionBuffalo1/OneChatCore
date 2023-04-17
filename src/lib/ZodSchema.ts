import { z } from 'zod';
import { maxPassLen } from '../Constants';

const WsAuthSchema = z.object({
  token: z.string()
});

const PasswordSchema = z
  .string()
  .min(8, 'Password length should be greater than 8')
  .max(maxPassLen, `Password length should be less than ${maxPassLen}`)
  .regex(/[~`'!@#$%^&*()-_+={}[]|;:"<>,\.\/?]/g, 'Password must contain a special character')
  .refine(
    val => /[a-z]/g.test(val) && /[A-Z]/g.test(val) && /[0-9]/g.test(val),
    'Password must contain a lowercase, uppercase, and a numerical digit'
  );

const WsMessageSchema = z.object({
  content: z.string(),
  images: z.optional(z.array(z.string()))
});

export { WsAuthSchema, WsMessageSchema, PasswordSchema };
