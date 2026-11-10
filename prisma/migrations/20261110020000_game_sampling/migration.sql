ALTER TABLE "Content" ADD COLUMN "sampleKey" DOUBLE PRECISION NOT NULL DEFAULT random();
DROP INDEX "Content_game_filter_idx";
CREATE INDEX "Content_game_sample_idx" ON "Content" (("publishedData"->>'mode'), ("publishedData"->>'difficulty'), "sampleKey") WHERE kind = 'GAME' AND "publishedData" IS NOT NULL;
