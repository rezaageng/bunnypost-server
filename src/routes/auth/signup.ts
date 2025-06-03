import { zValidator } from '@hono/zod-validator';
import 'dotenv/config';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import { usersTable } from '../../db/schema.js';
import { signUpSchema } from '../../schemas/signup-schema.js';
import { eq, or } from 'drizzle-orm';

export const signUp = new Hono();

signUp.post(
	'/',
	zValidator('form', signUpSchema, (result, c) => {
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
		const { email, firstName, lastName, password, username } =
			c.req.valid('form');

		const hashedPassword = await bcrypt.hash(password, 10);

		const existingUser = await db.query.usersTable.findFirst({
			where: (table) =>
				or(eq(table.email, email), eq(table.username, username)),
		});

		if (existingUser) {
			return c.json(
				{
					success: false,
					message: 'User already exists',
				},
				409,
			);
		}

		await db.insert(usersTable).values({
			email,
			username,
			firstName,
			lastName,
			password: hashedPassword,
		});

		const payload = {
			email,
			exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token valid for 1 hour
		};

		const token = await sign(payload, process.env.JWT_SECRET);

		return c.json(
			{
				success: true,
				message: 'User created successfully',
				token,
			},
			201,
		);
	},
);
