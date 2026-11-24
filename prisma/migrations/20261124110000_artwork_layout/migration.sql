WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", key) - 1 AS slot
  FROM "Content"
  WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL
    AND NOT ("publishedData" ? 'room') AND NOT ("publishedData" ? 'gallerySlot')
)
UPDATE "Content" AS content
SET data = jsonb_set(content.data, '{gallerySlot}', to_jsonb(numbered.slot)),
    "publishedData" = jsonb_set(content."publishedData", '{gallerySlot}', to_jsonb(numbered.slot))
FROM numbered WHERE content.id = numbered.id;

CREATE UNIQUE INDEX "Content_artwork_gallery_slot_unique" ON "Content" ((("publishedData"->>'gallerySlot')::integer))
WHERE kind = 'ARTWORK' AND status = 'PUBLISHED' AND "publishedData" IS NOT NULL AND "publishedData" ? 'gallerySlot';

CREATE INDEX "Content_artwork_editor_creator_search_idx" ON "Content" USING GIN ((data->>'creator') gin_trgm_ops)
WHERE kind = 'ARTWORK' AND status <> 'ARCHIVED';
