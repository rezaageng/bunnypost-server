import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { signInSchema } from '../../schemas/signin-schema.js';
import { db } from '../../db/index.js';

export const signIn = new Hono();

signIn.post(
	'/',
	zValidator('form', signInSchema, (result, c) => {
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
		const { email, password } = c.req.valid('form');

		const user = await db.query.usersTable.findFirst({
			where: (table) => eq(table.email, email),
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

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return c.json(
				{
					success: false,
					message: 'Invalid password',
				},
				401,
			);
		}

		const payload = {
			id: user.id,
			exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token valid for 1 hour
		};

		const token = await sign(payload, process.env.JWT_SECRET);

		return c.json({
			success: true,
			message: 'SignIn successful',
			token,
		});
	},
);
