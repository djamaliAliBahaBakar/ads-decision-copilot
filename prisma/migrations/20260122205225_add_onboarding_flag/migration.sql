-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adName" TEXT NOT NULL,
    "campaignName" TEXT,
    "angle" TEXT,
    "cpl" DOUBLE PRECISION NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "leads" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "weekNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaAdId" TEXT,
    "metaCampaignId" TEXT,
    "impressions" INTEGER,
    "clicks" INTEGER,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "hypothesis" TEXT,
    "expectedEffect" TEXT,
    "confidence" INTEGER,
    "cplAtDecision" DOUBLE PRECISION NOT NULL,
    "cplTrend3d" DOUBLE PRECISION,
    "daysRunning" INTEGER,
    "actualSavings" DOUBLE PRECISION,
    "wasCorrect" BOOLEAN,
    "postMortemNotes" TEXT,
    "resultFilledAt" TIMESTAMP(3),
    "followedRule" BOOLEAN,
    "appliedRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "days" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',
    "syncError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDigest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "disciplineScore" DOUBLE PRECISION NOT NULL,
    "economiesSaved" DOUBLE PRECISION NOT NULL,
    "bestDecision" TEXT,
    "worstDecision" TEXT,
    "cplTrend" DOUBLE PRECISION,
    "topInsight" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Ad_userId_date_idx" ON "Ad"("userId", "date");

-- CreateIndex
CREATE INDEX "Ad_userId_angle_idx" ON "Ad"("userId", "angle");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_userId_metaAdId_key" ON "Ad"("userId", "metaAdId");

-- CreateIndex
CREATE INDEX "Decision_userId_createdAt_idx" ON "Decision"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserRule_userId_isActive_idx" ON "UserRule"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MetaAccount_userId_key" ON "MetaAccount"("userId");

-- CreateIndex
CREATE INDEX "MetaAccount_userId_idx" ON "MetaAccount"("userId");

-- CreateIndex
CREATE INDEX "EmailDigest_userId_weekStartDate_idx" ON "EmailDigest"("userId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRule" ADD CONSTRAINT "UserRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAccount" ADD CONSTRAINT "MetaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDigest" ADD CONSTRAINT "EmailDigest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
