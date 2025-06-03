import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { eq, like, or, count } from 'drizzle-orm';
import { usersTable } from '../../db/schema.js';

export const users = new Hono();

users.get('/', async (c) => {
	const searchParams = c.req.query('search');
	const page = Number.parseInt(c.req.query('page') || '1', 10);
	const limit = Number.parseInt(c.req.query('limit') || '10', 10);
	const offset = (page - 1) * limit;

	const row = db.query.usersTable.findMany({
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

	const users = await row;

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
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})),
	});
});

users.get('/me', async (c) => {
	const payload = c.get('jwtPayload');

	const row = db.query.usersTable.findFirst({
		where: (table) => eq(table.email, payload.email),
	});

	const user = await row;

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
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		},
	});
});

users.get('/:username', async (c) => {
	const username = c.req.param('username');

	const row = db.query.usersTable.findFirst({
		where: (table) => eq(table.username, username),
	});
	const user = await row;

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
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		},
	});
});
