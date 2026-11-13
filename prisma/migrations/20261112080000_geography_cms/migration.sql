ALTER TYPE "ContentKind" ADD VALUE IF NOT EXISTS 'GEO_ENTRY';
ALTER TYPE "ContentKind" ADD VALUE IF NOT EXISTS 'GEO_CATEGORY';
CREATE INDEX IF NOT EXISTS "Content_published_geography_idx" ON "Content" (("publishedData"->>'area'), ("publishedData"->>'category'), key) WHERE "publishedData" IS NOT NULL;
