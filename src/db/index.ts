import { drizzle } from 'drizzle-orm/neon-http';
import 'dotenv/config';
import * as schema from './schema.js';

export const db = drizzle(process.env.DATABASE_URL, { schema });
