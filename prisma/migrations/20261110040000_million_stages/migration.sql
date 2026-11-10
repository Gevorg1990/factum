-- Keep all existing questions in their original five-question phase.
UPDATE "Content"
SET "data" = "data" || jsonb_build_object('stage', CASE WHEN "data"->'slot' >= '10'::jsonb THEN 'final' WHEN "data"->'slot' >= '5'::jsonb THEN 'middle' ELSE 'first' END)
WHERE kind = 'GAME' AND "data"->>'mode' = 'million' AND NOT ("data" ? 'stage');
UPDATE "Content"
SET "publishedData" = "publishedData" || jsonb_build_object('stage', CASE WHEN "publishedData"->'slot' >= '10'::jsonb THEN 'final' WHEN "publishedData"->'slot' >= '5'::jsonb THEN 'middle' ELSE 'first' END)
WHERE kind = 'GAME' AND "publishedData"->>'mode' = 'million' AND NOT ("publishedData" ? 'stage');
CREATE INDEX "Content_million_stage_sample_idx" ON "Content" (("publishedData"->>'mode'), ("publishedData"->>'difficulty'), ("publishedData"->>'stage'), "sampleKey") WHERE kind = 'GAME' AND "publishedData" IS NOT NULL;
