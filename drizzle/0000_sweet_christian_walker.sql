CREATE TABLE "drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"preview" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"highlights" text DEFAULT '' NOT NULL,
	"changelog_url" text DEFAULT '' NOT NULL,
	"cta" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipients" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipients_email_unique" UNIQUE("email")
);
