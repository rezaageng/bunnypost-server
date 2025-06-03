import { Hono } from 'hono';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';

export const users = new Hono();

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
