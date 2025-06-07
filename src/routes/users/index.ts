import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { eq, like, or, count } from 'drizzle-orm';
import { usersTable } from '../../db/schema.js';
import { zValidator } from '@hono/zod-validator';
import { userUpdateSchema } from '../../schemas/user-schema.js';
import { v2 as cloudinary } from 'cloudinary';

export const users = new Hono();

users.get('/', async (c) => {
	const searchParams = c.req.query('search');
	const page = Number.parseInt(c.req.query('page') || '1', 10);
	const limit = Number.parseInt(c.req.query('limit') || '10', 10);
	const offset = (page - 1) * limit;

	const users = await db.query.usersTable.findMany({
		where: searchParams
			? (table) =>
					or(
						like(table.username, `%${searchParams}%`),
						like(table.firstName, `%${searchParams}%`),
						like(table.lastName, `%${searchParams}%`),
					)
			: undefined,
		limit,
		offset,
	});

	const totalCount = await db
		.select({ count: count() })
		.from(usersTable)
		.where(
			searchParams
				? or(
						like(usersTable.username, `%${searchParams}%`),
						like(usersTable.firstName, `%${searchParams}%`),
						like(usersTable.lastName, `%${searchParams}%`),
					)
				: undefined,
		);

	if (users.length === 0) {
		return c.json(
			{
				success: false,
				message: 'No users found',
			},
			404,
		);
	}

	return c.json({
		success: true,
		message: 'Users fetched successfully',
		pagination: {
			page,
			limit,
			total: users.length,
			totalPages: Math.ceil(totalCount[0].count / limit),
		},
		data: users.map((user) => ({
			id: user.id,
			email: user.email,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			bio: user.bio,
			profilePicture: user.profilePicture,
			header: user.header,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})),
	});
});

users.get('/me', async (c) => {
	const payload = c.get('jwtPayload');

	const user = await db.query.usersTable.findFirst({
		where: (table) => eq(table.id, payload.id),
		with: {
			posts: {
				columns: {
					id: true,
					content: true,
					title: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			likes: {
				columns: {
					id: true,
					postId: true,
				},
			},
			comments: {
				columns: {
					id: true,
					content: true,
					postId: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	});

	if (!user) {
		return c.json(
			{
				success: false,
				message: 'User not found',
			},
			404,
		);
	}

	return c.json({
		success: true,
		message: 'Users fetched successfully',
		data: {
			id: user.id,
			email: user.email,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			bio: user.bio,
			profilePicture: user.profilePicture,
			header: user.header,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			posts: user.posts,
			likes: user.likes,
			comments: user.comments,
		},
	});
});

users.get('/:username', async (c) => {
	const username = c.req.param('username');

	const user = await db.query.usersTable.findFirst({
		where: (table) => eq(table.username, username),
		with: {
			posts: {
				columns: {
					id: true,
					content: true,
					title: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			likes: {
				columns: {
					id: true,
					postId: true,
				},
			},
			comments: {
				columns: {
					id: true,
					content: true,
					postId: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	});

	if (!user) {
		return c.json(
			{
				success: false,
				message: 'User not found',
			},
			404,
		);
	}

	return c.json({
		success: true,
		message: 'User fetched successfully',
		data: {
			id: user.id,
			email: user.email,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			bio: user.bio,
			profilePicture: user.profilePicture,
			header: user.header,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			posts: user.posts,
			likes: user.likes,
			comments: user.comments,
		},
	});
});

users.put(
	'/:id',
	zValidator('form', userUpdateSchema, (result, c) => {
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
		const payload = c.get('jwtPayload');
		const id = c.req.param('id');

		const {
			username,
			firstName,
			lastName,
			bio,
			profilePicture,
			header,
			email,
		} = c.req.valid('form');

		let profilePictureUrl = '';
		let headerUrl = '';

		const user = await db.query.usersTable.findFirst({
			where: (table) => eq(table.id, id),
		});

		if (!user) {
			return c.json(
				{
					success: false,
					message: 'User not found',
				},
				404,
			);
		}

		if (user.id !== payload.id) {
			return c.json(
				{
					success: false,
					message: 'You are not authorized to update this user',
				},
				403,
			);
		}

		if (profilePicture) {
			try {
				const profilePictureUpload = await cloudinary.uploader.upload(
					profilePicture,
					{
						folder: 'profile_pictures',
						allowed_formats: ['jpg', 'png', 'jpeg'],
					},
				);
				profilePictureUrl = profilePictureUpload.secure_url;
			} catch (_e) {
				return c.json(
					{
						success: false,
						message: 'Error uploading profile picture',
					},
					500,
				);
			}
		}

		if (header) {
			try {
				const headerUpload = await cloudinary.uploader.upload(header, {
					folder: 'headers',
					allowed_formats: ['jpg', 'png', 'jpeg'],
				});
				headerUrl = headerUpload.secure_url;
			} catch (_e) {
				return c.json(
					{
						success: false,
						message: 'Error uploading header image',
					},
					500,
				);
			}
		}

		const updatedUser = await db
			.update(usersTable)
			.set({
				username,
				firstName,
				lastName,
				bio,
				profilePicture: profilePictureUrl,
				header: headerUrl,
				email,
			})
			.where(eq(usersTable.id, id))
			.returning();

		if (updatedUser.length === 0) {
			return c.json(
				{
					success: false,
					message: 'User not updated',
				},
				500,
			);
		}

		return c.json({
			success: true,
			message: 'User updated successfully',
			data: {
				id: updatedUser[0].id,
				email: updatedUser[0].email,
				username: updatedUser[0].username,
				firstName: updatedUser[0].firstName,
				lastName: updatedUser[0].lastName,
				bio: updatedUser[0].bio,
				profilePicture: updatedUser[0].profilePicture,
				header: updatedUser[0].header,
				createdAt: updatedUser[0].createdAt,
				updatedAt: updatedUser[0].updatedAt,
			},
		});
	},
);
