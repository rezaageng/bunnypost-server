import type { Hono } from 'hono';
import { signUp } from './auth/signup.js';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { signIn } from './auth/signin.js';
import { users } from './users/index.js';
import { posts } from './posts/index.js';
import { comments } from './comments/index.js';
import { likes } from './likes/index.js';

export const routes = (app: Hono) => {
	app.use(logger());

	app.get('/', (c) => {
		return c.text('Welcome to BunnyPost!');
	});

	app.route('/api/auth/signup', signUp);
	app.route('/api/auth/signin', signIn);

	app.use('/api/*', jwt({ secret: process.env.JWT_SECRET }));

	app.route('/api/users', users);
	app.route('/api/posts', posts);
	app.route('/api/comments', comments);
	app.route('/api/likes', likes);
};
