import { z } from 'zod';
import { maxPassLen } from '../Constants';

const WsAuthSchema = z.object({
  token: z.string().min(1)
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

const userSchema = z.object({
  username: z.string().min(3, 'Username should be greater than 3').max(20, 'Username should be less than 20'),
  password: PasswordSchema,
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(3, 'First name should be greater than 3').max(20, 'First name should be less than 20')
});

const channelSchema = z.object({
  name: z.string().min(3, 'Channel name should be greater than 3').max(20, 'Channel name should be less than 20')
});

const groupSchema = z.object({
  name: z.string().min(3, 'Group name should be greater than 3').max(20, 'Group name should be less than 20'),
  description: z.string().max(100, 'Group description should be less than 100').optional(),
  channels: z.array(channelSchema).optional(),
  createdBy: userSchema
});

export { WsAuthSchema, PasswordSchema, groupSchema };
