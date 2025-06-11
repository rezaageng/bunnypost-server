import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import 'dotenv/config';
import { routes } from './routes/index.js';

export const app = new Hono();

routes(app);

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
