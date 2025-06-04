import { createInsertSchema } from 'drizzle-zod';
import { commentsTable } from '../db/schema.js';

export const commentCreateSchema = createInsertSchema(commentsTable, {
	authorId: (schema) => schema.optional(),
});
