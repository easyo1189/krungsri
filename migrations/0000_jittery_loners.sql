CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"bank_name" text,
	"account_number" text,
	"account_name" text,
	"withdrawal_code" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"term" integer NOT NULL,
	"interest_rate" integer NOT NULL,
	"monthly_payment" integer NOT NULL,
	"purpose" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_id" integer,
	"admin_note" text,
	"full_name" text,
	"id_card_number" text,
	"age" integer,
	"phone" text,
	"address" text,
	"occupation" text,
	"income" integer,
	"remaining_income" integer,
	"front_id_card_image" text,
	"back_id_card_image" text,
	"selfie_with_id_card_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"file_url" text,
	"file_name" text,
	"file_size" integer,
	"file_mime_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"type" text NOT NULL,
	"related_entity_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"age" integer,
	"birth_date" text,
	"address" text,
	"occupation" text,
	"monthly_income" integer,
	"remaining_income" integer,
	"id_card_number" text,
	"profile_picture" text,
	"front_id_card_image" text,
	"back_id_card_image" text,
	"selfie_with_id_card_image" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"google_id" text,
	"facebook_id" text,
	"auth_provider" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_facebook_id_unique" UNIQUE("facebook_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_id" integer,
	"admin_note" text,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
