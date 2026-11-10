-- Retain phase metadata for older deployments during release/rollback. New
-- deployments select exclusively by slot; this does not change bank membership.
UPDATE "Content" SET data=data || jsonb_build_object('stage',CASE WHEN data->'slot'>='10'::jsonb THEN 'final' WHEN data->'slot'>='5'::jsonb THEN 'middle' ELSE 'first' END)
WHERE kind='GAME' AND data->>'mode'='million' AND NOT (data ? 'stage');
UPDATE "Content" SET "publishedData"="publishedData" || jsonb_build_object('stage',CASE WHEN "publishedData"->'slot'>='10'::jsonb THEN 'final' WHEN "publishedData"->'slot'>='5'::jsonb THEN 'middle' ELSE 'first' END)
WHERE kind='GAME' AND "publishedData"->>'mode'='million' AND NOT ("publishedData" ? 'stage');
