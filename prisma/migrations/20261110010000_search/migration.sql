
-- Full-text index for Armenian and other Unicode lexemes without stemming.
CREATE INDEX "Content_published_search_idx" ON "Content" USING GIN (to_tsvector('simple', "publishedData"::text));
CREATE INDEX "Content_game_filter_idx" ON "Content" (("publishedData"->>'mode'), ("publishedData"->>'difficulty')) WHERE kind = 'GAME' AND "publishedData" IS NOT NULL;
