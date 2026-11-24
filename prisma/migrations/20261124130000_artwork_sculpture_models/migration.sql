UPDATE "Content" SET status = 'ARCHIVED', "publishedData" = NULL
WHERE kind = 'ARTWORK' AND key = 'buddha-shakyamuni';

INSERT INTO "DeletedContentKey" (kind, key, "deletedAt")
VALUES ('ARTWORK', 'buddha-shakyamuni', NOW())
ON CONFLICT (kind, key) DO NOTHING;

WITH sculptures (key, title, original_title, creator, creator_info, work_date, medium, description, context, look_for, image, source, model_source, room) AS (
  VALUES
  ('greek-slave', 'Հույն ստրկուհին', 'Model of the Greek Slave', 'Հայրամ Փաուերս',
   'Հայրամ Փաուերսը ամերիկացի քանդակագործ էր, որի «Հույն ստրկուհին» լայն ճանաչում ստացավ 19-րդ դարում։',
   '1843', 'Գիպսե քանդակ',
   'Փաուերսի «Հույն ստրկուհու» այս գիպսե մոդելը ստեղծվել է 1843 թվականին։ Քանդակի շուրջը կարելի է պտտվել և դիտել կերպարի դիրքը տարբեր կողմերից։',
   'Սրահում ցուցադրված է Սմիթսոնյան ամերիկյան արվեստի թանգարանի գիպսե մոդելի եռաչափ սկանը։ Վիրտուալ սրահում մոդելը մեծացված է դիտման հարմարության համար։',
   'Դիտիր մարմնի ծանրության հենումը և ձեռքերի դիրքը տարբեր դիտանկյուններից։',
   '/images/art/greek-slave.webp', 'https://americanart.si.edu/artwork/model-of-the-greek-slave-20060',
   'https://3d.si.edu/object/3d/model-greek-slave:8edffe56-c358-4c3a-a61f-019f615ccef0', 0),
  ('girl-skating', 'Սահող աղջիկը', 'Girl Skating', 'Աբաստենիա Սենտ Լեժե Էբերլե',
   'Աբաստենիա Սենտ Լեժե Էբերլեն ամերիկացի քանդակագործ էր, որի ստեղծագործություններում հաճախ պատկերված են առօրյա շարժման պահեր։',
   'մոդելավորված՝ 1906', 'Բրոնզե քանդակ',
   'Սահող աղջկա շարժումը փոխանցվում է մարմնի թեքված դիրքով և առաջ մեկնած ձեռքերով։',
   'Սրահում ցուցադրված է Սմիթսոնյան ամերիկյան արվեստի թանգարանի քանդակի եռաչափ սկանը։ Վիրտուալ սրահում փոքր բնօրինակը մեծացված է դիտման հարմարության համար։',
   'Շրջիր քանդակի շուրջը և հետևիր, թե ինչպես է մարմնի շարժումն ընթանում ոտքերից դեպի ձեռքերը։',
   '/images/art/girl-skating.webp', 'https://americanart.si.edu/artwork/girl-skating-80645',
   'https://3d.si.edu/object/3d/girl-skating:e8d1f790-28a8-492d-84f5-cf2817f8cdcf', 5)
), records AS (
  SELECT key, title,
    jsonb_build_object(
      'id', key, 'title', title, 'originalTitle', original_title, 'creator', creator,
      'creatorInfo', creator_info, 'date', work_date, 'medium', medium,
      'description', description, 'context', context, 'lookFor', look_for,
      'image', image, 'source', source, 'imageSource', source,
      'imageCredit', 'Smithsonian American Art Museum · CC0', 'imageLicense', 'https://creativecommons.org/publicdomain/zero/1.0/',
      'modelCredit', 'Smithsonian 3D · CC0', 'modelSource', model_source, 'room', room,
      'location', 'Սմիթսոնյան ամերիկյան արվեստի թանգարան'
    ) AS artwork
  FROM sculptures
)
INSERT INTO "Content" (id, kind, key, title, data, "publishedData", status, "publishedAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ARTWORK', key, title, artwork, artwork, 'PUBLISHED', NOW(), NOW(), NOW()
FROM records
ON CONFLICT (kind, key) DO NOTHING;
