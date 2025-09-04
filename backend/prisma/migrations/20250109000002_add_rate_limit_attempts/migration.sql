-- CreateTable
CREATE TABLE "rate_limit_attempts" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_attempts_key_idx" ON "rate_limit_attempts"("key");

-- CreateIndex
CREATE INDEX "rate_limit_attempts_timestamp_idx" ON "rate_limit_attempts"("timestamp");

-- CreateIndex
CREATE INDEX "rate_limit_attempts_key_timestamp_idx" ON "rate_limit_attempts"("key", "timestamp");