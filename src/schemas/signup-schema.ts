import { createInsertSchema } from 'drizzle-zod';
import { usersTable } from '../db/schema.js';

export const signUpSchema = createInsertSchema(usersTable);
