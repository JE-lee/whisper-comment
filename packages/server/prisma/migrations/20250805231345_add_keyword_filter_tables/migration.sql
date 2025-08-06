-- CreateTable
CREATE TABLE "keyword_filters" (
    "filter_id" SERIAL NOT NULL,
    "site_id" UUID,
    "keyword" VARCHAR(100) NOT NULL,
    "match_type" VARCHAR(20) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "replacement" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "keyword_filters_pkey" PRIMARY KEY ("filter_id")
);

-- CreateTable
CREATE TABLE "filter_logs" (
    "log_id" SERIAL NOT NULL,
    "comment_id" UUID NOT NULL,
    "filter_id" INTEGER NOT NULL,
    "original_text" TEXT NOT NULL,
    "filtered_text" TEXT,
    "action" VARCHAR(20) NOT NULL,
    "matched_keyword" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filter_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "idx_keyword_filters_site_id" ON "keyword_filters"("site_id");

-- CreateIndex
CREATE INDEX "idx_keyword_filters_keyword" ON "keyword_filters"("keyword");

-- CreateIndex
CREATE INDEX "idx_keyword_filters_is_active" ON "keyword_filters"("is_active");

-- CreateIndex
CREATE INDEX "idx_filter_logs_comment_id" ON "filter_logs"("comment_id");

-- CreateIndex
CREATE INDEX "idx_filter_logs_filter_id" ON "filter_logs"("filter_id");

-- CreateIndex
CREATE INDEX "idx_filter_logs_created_at" ON "filter_logs"("created_at");

-- AddForeignKey
ALTER TABLE "keyword_filters" ADD CONSTRAINT "keyword_filters_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filter_logs" ADD CONSTRAINT "filter_logs_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("comment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filter_logs" ADD CONSTRAINT "filter_logs_filter_id_fkey" FOREIGN KEY ("filter_id") REFERENCES "keyword_filters"("filter_id") ON DELETE RESTRICT ON UPDATE CASCADE;
