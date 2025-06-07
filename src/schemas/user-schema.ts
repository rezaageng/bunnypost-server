import { createUpdateSchema } from 'drizzle-zod';
import { usersTable } from '../db/schema.js';

export const userUpdateSchema = createUpdateSchema(usersTable);
