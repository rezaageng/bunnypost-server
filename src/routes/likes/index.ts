import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { likeCreateSchema } from '../../schemas/likes-schema.js';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { likesTable } from '../../db/schema.js';

export const likes = new Hono();

likes.post(
	'/',
	zValidator('form', likeCreateSchema, (result, c) => {
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
		const { postId } = c.req.valid('form');

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

		const newLike = await db
			.insert(likesTable)
			.values({
				postId,
				authorId,
			})
			.returning();

		return c.json({
			success: true,
			data: newLike[0],
		});
	},
);

likes.delete('/:id', async (c) => {
	const likeId = c.req.param('id');
	const authorId = c.get('jwtPayload').id;

	const isLikeExists = await db.query.likesTable.findFirst({
		where: (table) => eq(table.id, likeId),
	});

	if (!isLikeExists) {
		return c.json(
			{
				success: false,
				message: 'Like not found',
			},
			404,
		);
	}

	if (isLikeExists.authorId !== authorId) {
		return c.json(
			{
				success: false,
				message: 'You can only delete your own likes',
			},
			403,
		);
	}

	await db.delete(likesTable).where(eq(likesTable.id, likeId));

	return c.json({
		success: true,
		message: 'Like deleted successfully',
	});
});
