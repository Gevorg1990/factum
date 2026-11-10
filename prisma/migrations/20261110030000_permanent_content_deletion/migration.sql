CREATE TABLE "DeletedContentKey" (
    "kind" "ContentKind" NOT NULL,
    "key" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeletedContentKey_pkey" PRIMARY KEY ("kind", "key")
);
