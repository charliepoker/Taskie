-- CreateTable
CREATE TABLE "auth_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "requestId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "email" TEXT,
    "attemptCount" INTEGER NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_attempts_email_idx" ON "auth_attempts"("email");

-- CreateIndex
CREATE INDEX "auth_attempts_ipAddress_idx" ON "auth_attempts"("ipAddress");

-- CreateIndex
CREATE INDEX "auth_attempts_success_idx" ON "auth_attempts"("success");

-- CreateIndex
CREATE INDEX "auth_attempts_timestamp_idx" ON "auth_attempts"("timestamp");

-- CreateIndex
CREATE INDEX "auth_attempts_email_timestamp_idx" ON "auth_attempts"("email", "timestamp");

-- CreateIndex
CREATE INDEX "auth_attempts_ipAddress_timestamp_idx" ON "auth_attempts"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "suspicious_activities_ipAddress_idx" ON "suspicious_activities"("ipAddress");

-- CreateIndex
CREATE INDEX "suspicious_activities_email_idx" ON "suspicious_activities"("email");

-- CreateIndex
CREATE INDEX "suspicious_activities_type_idx" ON "suspicious_activities"("type");

-- CreateIndex
CREATE INDEX "suspicious_activities_severity_idx" ON "suspicious_activities"("severity");

-- CreateIndex
CREATE INDEX "suspicious_activities_lastSeen_idx" ON "suspicious_activities"("lastSeen");

-- CreateIndex
CREATE INDEX "suspicious_activities_ipAddress_lastSeen_idx" ON "suspicious_activities"("ipAddress", "lastSeen");