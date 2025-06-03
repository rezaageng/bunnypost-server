import { reset, seed } from 'drizzle-seed';
import { db } from './index.js';
import * as schema from './schema.js';

const seedDb = async () => {
	console.log('Resetting database...');
	await reset(db, schema);

	console.log('Seeding database...');
	await seed(db, schema);

	console.log('Database seeded successfully.');
};

seedDb();
