import { relations } from 'drizzle-orm';
import {
	date,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	username: varchar().notNull().unique(),
	email: varchar().notNull().unique(),
	password: varchar().notNull(),
	firstName: varchar('first_name').notNull(),
	lastName: varchar('last_name').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelation = relations(usersTable, ({ many }) => ({
	posts: many(postsTable),
}));

export const postsTable = pgTable('posts', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	title: varchar().notNull(),
	content: text().notNull(),
	authorId: uuid('author_id').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const postsRelation = relations(postsTable, ({ one, many }) => ({
	author: one(usersTable, {
		fields: [postsTable.authorId],
		references: [usersTable.id],
	}),
	comments: many(commentsTable),
}));

export const commentsTable = pgTable('comments', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	content: text().notNull(),
	postId: uuid('post_id').notNull(),
	authorId: uuid('author_id').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const commentsRelation = relations(commentsTable, ({ one }) => ({
	post: one(postsTable, {
		fields: [commentsTable.postId],
		references: [postsTable.id],
	}),
}));
