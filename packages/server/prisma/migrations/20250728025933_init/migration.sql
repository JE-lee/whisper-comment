-- CreateTable
CREATE TABLE "sites" (
    "site_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "api_key" VARCHAR(64) NOT NULL,
    "settings" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("site_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "comment_id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "page_identifier" TEXT NOT NULL,
    "parent_id" UUID,
    "author_token" TEXT NOT NULL,
    "author_nickname" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "subscription_id" SERIAL NOT NULL,
    "author_token" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "did_associations" (
    "author_token" TEXT NOT NULL,
    "did_address" VARCHAR(255) NOT NULL,
    "did_type" VARCHAR(20) NOT NULL,
    "linked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "did_associations_pkey" PRIMARY KEY ("author_token")
);

-- CreateTable
CREATE TABLE "comment_votes" (
    "vote_id" SERIAL NOT NULL,
    "comment_id" UUID NOT NULL,
    "author_token" TEXT NOT NULL,
    "vote_type" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("vote_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_domain_key" ON "sites"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "sites_api_key_key" ON "sites"("api_key");

-- CreateIndex
CREATE INDEX "idx_comments_page_identifier" ON "comments"("site_id", "page_identifier");

-- CreateIndex
CREATE INDEX "idx_comments_author_token" ON "comments"("author_token");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "did_associations_did_address_key" ON "did_associations"("did_address");

-- CreateIndex
CREATE INDEX "idx_votes_author_token" ON "comment_votes"("author_token");

-- CreateIndex
CREATE UNIQUE INDEX "unique_comment_author_vote" ON "comment_votes"("comment_id", "author_token");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("comment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("comment_id") ON DELETE CASCADE ON UPDATE CASCADE;
