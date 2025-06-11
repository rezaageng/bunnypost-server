import { createInsertSchema } from 'drizzle-zod';
import { likesTable } from '../db/schema.js';

export const likeCreateSchema = createInsertSchema(likesTable, {
	authorId: (schema) => schema.optional(),
});
