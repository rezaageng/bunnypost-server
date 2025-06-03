import { z } from 'zod';

export const signInSchema = z.object({
	email: z.string().email().min(1, 'Email is required'),
	password: z.string().min(8, 'Password must be at least 6 characters long'),
});
