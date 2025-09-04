-- CreateTable
CREATE TABLE "blacklisted_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklisted_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_tokens_tokenHash_key" ON "blacklisted_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_tokenHash_idx" ON "blacklisted_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_userId_idx" ON "blacklisted_tokens"("userId");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_expiresAt_idx" ON "blacklisted_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_tokenType_idx" ON "blacklisted_tokens"("tokenType");