import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { commentCreateSchema } from '../../schemas/comments-schema.js';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { commentsTable } from '../../db/schema.js';

export const comments = new Hono();

comments.post(
	'/',
	zValidator('form', commentCreateSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{
					success: false,
					message: 'Invalid input',
					errors: result.error,
				},
				400,
			);
		}
	}),
	async (c) => {
		const { content, postId } = c.req.valid('form');

		const authorId = c.get('jwtPayload').id;

		const isUserExists = await db.query.usersTable.findFirst({
			where: (table) => eq(table.id, authorId),
		});

		if (!isUserExists) {
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		const isPostExists = await db.query.postsTable.findFirst({
			where: (table) => eq(table.id, postId),
		});
		if (!isPostExists) {
			return c.json(
				{
					success: false,
					message: 'Post not found',
				},
				404,
			);
		}

		const newComment = await db
			.insert(commentsTable)
			.values({
				content,
				postId,
				authorId,
			})
			.returning();

		return c.json({
			success: true,
			message: 'Comment created successfully',
			data: newComment[0],
		});
	},
);

comments.delete('/:id', async (c) => {
	const commentId = c.req.param('id');
	const authorId = c.get('jwtPayload').id;

	const comment = await db.query.commentsTable.findFirst({
		where: (table) => eq(table.id, commentId),
	});

	if (!comment) {
		return c.json(
			{
				success: false,
				message: 'Comment not found',
			},
			404,
		);
	}

	if (comment.authorId !== authorId) {
		return c.json(
			{
				success: false,
				message: 'You are not authorized to delete this comment',
			},
			403,
		);
	}

	await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

	return c.json({
		success: true,
		message: 'Comment deleted successfully',
	});
});
