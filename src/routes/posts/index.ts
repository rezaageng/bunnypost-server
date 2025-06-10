import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { count, eq, ilike, or } from 'drizzle-orm';
import { postsTable } from '../../db/schema.js';
import { zValidator } from '@hono/zod-validator';
import {
	postCreateSchema,
	postUpdateSchema,
} from '../../schemas/post-schema.js';

export const posts = new Hono();

posts.get('/', async (c) => {
	const searchParams = c.req.query('search');
	const page = Number.parseInt(c.req.query('page') || '1', 10);
	const limit = Number.parseInt(c.req.query('limit') || '10', 10);
	const offset = (page - 1) * limit;

	const posts = await db.query.postsTable.findMany({
		where: searchParams
			? (table) =>
					or(
						ilike(table.title, `%${searchParams}%`),
						ilike(table.content, `%${searchParams}%`),
					)
			: undefined,
		with: {
			author: {
				columns: {
					id: true,
					username: true,
					firstName: true,
					lastName: true,
				},
			},
			comments: {
				columns: {
					id: true,
					content: true,
					createdAt: true,
					authorId: true,
				},
			},
			likes: {
				columns: {
					id: true,
					authorId: true,
				},
			},
		},
		limit,
		offset,
	});

	const totalCount = await db
		.select({ count: count() })
		.from(postsTable)
		.where(
			searchParams
				? or(
						ilike(postsTable.title, `%${searchParams}%`),
						ilike(postsTable.content, `%${searchParams}%`),
					)
				: undefined,
		);

	if (posts.length === 0) {
		return c.json(
			{
				success: false,
				message: 'No posts found',
			},
			404,
		);
	}

	return c.json({
		success: true,
		message: 'Posts fetched successfully',
		pagination: {
			page,
			limit,
			total: posts.length,
			totalPages: Math.ceil(totalCount[0].count / limit),
		},
		data: posts,
	});
});

posts.get('/:id', async (c) => {
	const id = c.req.param('id');
	if (!id) {
		return c.json(
			{
				success: false,
				message: 'Post ID is required',
			},
			400,
		);
	}

	const post = await db.query.postsTable.findFirst({
		where: (table) => eq(table.id, id),
		with: {
			author: {
				columns: {
					id: true,
					username: true,
					firstName: true,
					lastName: true,
				},
			},
			comments: {
				columns: {
					id: true,
					content: true,
					createdAt: true,
				},
				with: {
					author: {
						columns: {
							id: true,
							username: true,
							firstName: true,
							lastName: true,
						},
					},
				},
			},
			likes: {
				columns: {
					id: true,
					authorId: true,
				},
			},
		},
	});

	if (!post) {
		return c.json(
			{
				success: false,
				message: 'Post not found',
			},
			404,
		);
	}

	return c.json({
		success: true,
		message: 'Post fetched successfully',
		data: post,
	});
});

posts.post(
	'/',
	zValidator('form', postCreateSchema, (result, c) => {
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
		const { title, content } = c.req.valid('form');
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

		const newPost = await db
			.insert(postsTable)
			.values({
				title,
				content,
				authorId,
			})
			.returning();

		return c.json({
			success: true,
			message: 'Post created successfully',
			data: newPost[0],
		});
	},
);

posts.put(
	'/:id',
	zValidator('form', postUpdateSchema, (result, c) => {
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
		const id = c.req.param('id');
		const { title, content } = c.req.valid('form');
		const authorId = c.get('jwtPayload').id;

		const post = await db.query.postsTable.findFirst({
			where: (table) => eq(table.id, id),
		});

		if (!post) {
			return c.json(
				{
					success: false,
					message: 'Post not found',
				},
				404,
			);
		}

		if (post.authorId !== authorId) {
			return c.json(
				{
					success: false,
					message: 'You are not authorized to update this post',
				},
				403,
			);
		}

		const updatedPost = await db
			.update(postsTable)
			.set({
				title,
				content,
			})
			.where(eq(postsTable.id, id))
			.returning();

		return c.json({
			success: true,
			message: 'Post updated successfully',
			data: updatedPost[0],
		});
	},
);

posts.delete('/:id', async (c) => {
	const id = c.req.param('id');
	const authorId = c.get('jwtPayload').id;

	const post = await db.query.postsTable.findFirst({
		where: (table) => eq(table.id, id),
	});

	if (!post) {
		return c.json(
			{
				success: false,
				message: 'Post not found',
			},
			404,
		);
	}

	if (post.authorId !== authorId) {
		return c.json(
			{
				success: false,
				message: 'You are not authorized to delete this post',
			},
			403,
		);
	}

	await db.delete(postsTable).where(eq(postsTable.id, id));

	return c.json({
		success: true,
		message: 'Post deleted successfully',
	});
});
