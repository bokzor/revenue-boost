-- CreateTable
CREATE TABLE "challenge_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_tokens_token_key" ON "challenge_tokens"("token");

-- CreateIndex
CREATE INDEX "challenge_tokens_token_idx" ON "challenge_tokens"("token");

-- CreateIndex
CREATE INDEX "challenge_tokens_campaignId_idx" ON "challenge_tokens"("campaignId");

-- CreateIndex
CREATE INDEX "challenge_tokens_expiresAt_idx" ON "challenge_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "challenge_tokens_sessionId_idx" ON "challenge_tokens"("sessionId");

-- CreateIndex
CREATE INDEX "rate_limit_logs_key_action_createdAt_idx" ON "rate_limit_logs"("key", "action", "createdAt");
