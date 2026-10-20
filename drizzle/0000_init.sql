CREATE SCHEMA IF NOT EXISTS "czytasyn";
--> statement-breakpoint
CREATE TABLE "czytasyn"."account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "czytasyn"."child" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text DEFAULT '🦊' NOT NULL,
	"theme" text DEFAULT 'forest' NOT NULL,
	"lang" text DEFAULT 'pl' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "czytasyn"."progress" (
	"childId" text NOT NULL,
	"lessonId" text NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"masteredItems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lastSeen" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "progress_childId_lessonId_pk" PRIMARY KEY("childId","lessonId")
);
--> statement-breakpoint
CREATE TABLE "czytasyn"."session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "czytasyn"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "czytasyn"."verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "czytasyn"."account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "czytasyn"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "czytasyn"."child" ADD CONSTRAINT "child_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "czytasyn"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "czytasyn"."progress" ADD CONSTRAINT "progress_childId_child_id_fk" FOREIGN KEY ("childId") REFERENCES "czytasyn"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "czytasyn"."session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "czytasyn"."user"("id") ON DELETE cascade ON UPDATE no action;