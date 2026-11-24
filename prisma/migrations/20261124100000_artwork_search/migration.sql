CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Content_artwork_title_search_idx" ON "Content" USING GIN (("publishedData"->>'title') gin_trgm_ops)
WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL;

CREATE INDEX "Content_artwork_original_title_search_idx" ON "Content" USING GIN (("publishedData"->>'originalTitle') gin_trgm_ops)
WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL;

CREATE INDEX "Content_artwork_creator_search_idx" ON "Content" USING GIN (("publishedData"->>'creator') gin_trgm_ops)
WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL;
