CREATE TABLE "VideoPreview" (
 "id" TEXT NOT NULL,
 "url" TEXT NOT NULL,
 "bytes" INTEGER NOT NULL,
 "sourceBytes" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "VideoPreview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VideoPreview_url_key" ON "VideoPreview"("url");
