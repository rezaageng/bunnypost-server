import type { Hono } from 'hono';
import { signUp } from './auth/signup.js';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';

export const routes = (app: Hono) => {
	app.use(logger());

	app.get('/', (c) => {
		return c.text('Welcome to BunnyPost!');
	});

	app.route('/api/auth/signup', signUp);

	app.use('/api/*', jwt({ secret: process.env.JWT_SECRET }));
};
