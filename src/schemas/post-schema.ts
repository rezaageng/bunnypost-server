import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { postsTable } from '../db/schema.js';

export const postCreateSchema = createInsertSchema(postsTable, {
	authorId: (schema) => schema.optional(),
});
export const postUpdateSchema = createUpdateSchema(postsTable);
