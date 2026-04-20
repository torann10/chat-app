import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullname: z.string().trim().min(3, 'Full name must be at least 3 characters').max(32, 'Full name must be at most 32 characters').optional(),
});
export type SignupBody = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginBody = z.infer<typeof LoginSchema>;

export const AuthTokenResponseSchema = z.object({
  token: z.string(),
  message: z.string().optional(),
});
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;