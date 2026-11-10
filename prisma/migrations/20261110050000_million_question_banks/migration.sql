-- Keep the original 0..14 positions. Questions added through the interim phase
-- editor are distributed deterministically inside their selected five positions.
WITH snapshots AS (
  SELECT id, 'data' AS field, data AS value FROM "Content" WHERE kind='GAME' AND data->>'mode'='million'
  UNION ALL
  SELECT id, 'publishedData', "publishedData" FROM "Content" WHERE kind='GAME' AND "publishedData"->>'mode'='million'
), positioned AS (
  SELECT *, CASE WHEN value->>'slot' ~ '^([0-9]|1[0-4])$' THEN (value->>'slot')::integer END AS old_slot,
    CASE value->>'stage' WHEN 'middle' THEN 5 WHEN 'final' THEN 10 ELSE 0 END AS base
  FROM snapshots
), assigned AS (
  SELECT *, CASE WHEN old_slot IS NOT NULL AND (NOT (value ? 'stage') OR old_slot BETWEEN base AND base+4)
    THEN old_slot ELSE base+((row_number() OVER (PARTITION BY field,value->>'difficulty',base ORDER BY id)-1)%5)::integer END AS slot
  FROM positioned
), updated AS (
  SELECT id, jsonb_object_agg(field, (value - 'stage') || jsonb_build_object('slot',slot)) AS payload FROM assigned GROUP BY id
)
UPDATE "Content" AS c SET data=COALESCE(u.payload->'data',c.data), "publishedData"=COALESCE(u.payload->'publishedData',c."publishedData") FROM updated u WHERE c.id=u.id;
CREATE INDEX "Content_million_slot_sample_idx" ON "Content" (("publishedData"->>'mode'), ("publishedData"->>'difficulty'), ("publishedData"->>'slot'), "sampleKey") WHERE kind='GAME' AND "publishedData" IS NOT NULL;
CREATE INDEX "Content_game_editor_bank_idx" ON "Content" ((data->>'mode'),(data->>'difficulty'),(data->>'slot')) WHERE kind='GAME';
DROP INDEX "Content_million_stage_sample_idx";
