UPDATE "Content"
SET data = jsonb_set(data, '{room}', to_jsonb(CASE WHEN key IN ('impression-sunrise','bathers') THEN 3 ELSE 4 END)),
    "publishedData" = CASE WHEN "publishedData" IS NULL THEN NULL ELSE jsonb_set("publishedData", '{room}', to_jsonb(CASE WHEN key IN ('impression-sunrise','bathers') THEN 3 ELSE 4 END)) END
WHERE kind = 'ARTWORK' AND key IN ('impression-sunrise','bathers','blue-armchair','floor-scrapers');
